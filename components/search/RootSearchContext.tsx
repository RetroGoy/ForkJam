"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  supabase,
  getRootNodes,
  getTopicScores,
  toggleNodeVote,
  type Node,
} from "@/lib/supabase/supabase";

type FilterId = "recent" | "popular" | "nearby" | string;

type RootSearchContextType = {
  roots: Node[];
  sorted: Node[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedFilters: FilterId[];
  setSelectedFilters: React.Dispatch<React.SetStateAction<FilterId[]>>;
  votes: Record<string, number>;
  handleVoteClick: (
    e: React.MouseEvent,
    node: Node,
    desired: 1 | -1
  ) => Promise<void>;
  childrenCounts: Record<string, number>;
  currentLocation: number | null;
  topicScores: Record<string, number>;
};

const RootSearchContext = createContext<RootSearchContextType | null>(null);

export function RootSearchProvider({ children }: { children: React.ReactNode }) {
  const [roots, setRoots] = useState<Node[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<FilterId[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [childrenCounts, setChildrenCounts] = useState<Record<string, number>>(
    {}
  );
  const [currentLocation, setCurrentLocation] = useState<number | null>(null);
  const [topicScores, setTopicScores] = useState<Record<string, number>>({});

  // FETCH ROOT NODES
  useEffect(() => {
    (async () => {
      const data = await getRootNodes();
      if (data) setRoots(data);
    })();
  }, []);

  // NOTES AGRÉGÉES PAR TOPIC
  useEffect(() => {
    (async () => setTopicScores(await getTopicScores()))();
  }, []);

  // USER LOCATION (department)
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Source primaire : métadonnées auth (pas de RLS). Secours : table users.
      let loc: number | null = null;
      const metaDep = user.user_metadata?.department;
      if (metaDep != null && String(metaDep) !== "") {
        const n = Number(metaDep);
        if (!Number.isNaN(n)) loc = n;
      }
      if (loc == null) {
        const { data } = await supabase
          .from("users")
          .select("department")
          .eq("id", user.id)
          .maybeSingle();
        if (data?.department) loc = Number(data.department);
      }
      setCurrentLocation(loc);
    })();
  }, []);

  // FETCH VOTES
  useEffect(() => {
    roots.forEach((n) =>
      supabase
        .from("votes")
        .select("value")
        .eq("target_type", "node")
        .eq("target_id", n.id)
        .then((res) => {
          const v = res.data?.[0]?.value ?? 0;
          setVotes((prev) => ({ ...prev, [n.id]: v }));
        })
    );
  }, [roots]);

  // FETCH CHILDREN COUNTS
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("nodes")
        .select("id,parent_node_id");

      if (!data) return;

      const result: Record<string, number> = {};
      for (const n of data as any[]) {
        if (!n.parent_node_id) continue;
        result[n.parent_node_id] = (result[n.parent_node_id] ?? 0) + 1;
      }
      setChildrenCounts(result);
    })();
  }, []);

  // Genres = tout ce qui n'est pas un filtre spécial (tri / proximité).
  const SPECIAL = ["recent", "popular", "nearby"];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  const genreFilters = useMemo(
    () => selectedFilters.filter((f) => !SPECIAL.includes(f)),
    [selectedFilters]
  );

  const filtered = useMemo(() => {
    const nearby = selectedFilters.includes("nearby");
    const term = searchTerm.toLowerCase().trim();

    return roots
      .filter((r) => r.title.toLowerCase().includes(term))
      .filter((r) => {
        if (genreFilters.length === 0) return true;
        const tag = norm(r.tag ?? "");
        return genreFilters.some((g) => tag.includes(norm(g)));
      })
      .filter((r) => {
        if (!nearby) return true;
        if (currentLocation == null) return false;
        return r.location != null && Number(r.location) === currentLocation;
      });
  }, [roots, searchTerm, genreFilters, selectedFilters, currentLocation]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const popular = selectedFilters.includes("popular");
    const recent = selectedFilters.includes("recent");

    copy.sort((a, b) => {
      if (popular) {
        const ca = childrenCounts[a.id] ?? 0;
        const cb = childrenCounts[b.id] ?? 0;
        if (ca !== cb) return cb - ca;
      }
      if (recent) {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (da !== db) return db - da;
      }
      return 0;
    });

    return copy;
  }, [filtered, selectedFilters, childrenCounts]);

  const handleVoteClick = async (
    e: React.MouseEvent,
    root: Node,
    desired: 1 | -1
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const current = votes[root.id] ?? 0;
    const next = current === desired ? 0 : desired;

    setVotes((prev) => ({ ...prev, [root.id]: next }));
    await toggleNodeVote(root.id, desired);
  };

  const value: RootSearchContextType = {
    roots,
    sorted,
    searchTerm,
    setSearchTerm,
    selectedFilters,
    setSelectedFilters,
    votes,
    handleVoteClick,
    childrenCounts,
    currentLocation,
    topicScores,
  };

  return (
    <RootSearchContext.Provider value={value}>
      {children}
    </RootSearchContext.Provider>
  );
}

export function useRootSearch() {
  const ctx = useContext(RootSearchContext);
  if (!ctx) {
    throw new Error("useRootSearch must be used inside RootSearchProvider");
  }
  return ctx;
}