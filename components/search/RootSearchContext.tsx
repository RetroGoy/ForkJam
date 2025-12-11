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

  const styleOptions = ["Rock", "Electro", "Jazz", "Experimental"] as const;

  // FETCH ROOT NODES
  useEffect(() => {
    (async () => {
      const data = await getRootNodes();
      if (data) setRoots(data);
    })();
  }, []);

  // USER LOCATION (department)
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("department")
        .eq("id", user.id)
        .single();

      const loc = data?.department ? Number(data.department) : null;
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

  const toggleFilter = (id: FilterId) => {
    setSelectedFilters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const styleFilters = useMemo(
    () => selectedFilters.filter((x) => styleOptions.includes(x as any)),
    [selectedFilters]
  );

  const filtered = useMemo(() => {
    return roots
      .filter((r) =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
      .filter((r) => {
        if (styleFilters.length === 0) return true;
        const tag = r.tag?.toLowerCase() ?? "";
        return styleFilters.some((sf) => tag.includes(sf.toLowerCase()));
      });
  }, [roots, searchTerm, styleFilters]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const popular = selectedFilters.includes("popular");
    const recent = selectedFilters.includes("recent");
    const nearby = selectedFilters.includes("nearby");

    copy.sort((a, b) => {
      if (nearby && currentLocation != null) {
        const aNear = a.location === currentLocation;
        const bNear = b.location === currentLocation;
        if (aNear && !bNear) return -1;
        if (!aNear && bNear) return 1;
      }

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
  }, [filtered, selectedFilters, childrenCounts, currentLocation]);

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