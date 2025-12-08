"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  Music2,
  User,
  MapPin,
} from "lucide-react";

import {
  supabase,
  getRootNodes,
  toggleNodeVote,
  type Node
} from "@/lib/supabase/supabase";

import { InlineRecorderButton } from "@/components/recorder/InlineRecorderButton";
import { getColorClass } from "@/lib/utils/getColorClass";

interface SidebarProps {
  topics: Node[];
}

export function Sidebar({ topics }: SidebarProps) {

  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────
  const [roots, setRoots] = useState<Node[]>(topics);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [childrenCounts, setChildrenCounts] = useState<Record<string, number>>({});
  const [currentLocation, setCurrentLocation] = useState<number | null>(null);

  // reload roots
  useEffect(() => {
    (async () => {
      const data = await getRootNodes();
      if (data) setRoots(data);
    })();
  }, []);

  // user “department”
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

  // fetch votes for each root
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

  // fetch children counts
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

  // filters
  const styleOptions = ["Rock", "Electro", "Jazz", "Experimental"];
  const filters = [
    { id: "recent", label: "Recent" },
    { id: "popular", label: "Popular" },
    { id: "nearby", label: "Position" },
    ...styleOptions.map((s) => ({ id: s, label: s })),
  ];

  const toggleFilter = (id: string) =>
    setSelectedFilters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const styleFilters = selectedFilters.filter((x) =>
    styleOptions.includes(x)
  );

  // filtering + sorting
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

  // vote handler
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

  // time formatter
  function formatTimeAgo(dateString?: string) {
    if (!dateString) return "";
    const created = new Date(dateString).getTime();
    const diffMs = Date.now() - created;

    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const h = Math.floor(min / 60);
    const d = Math.floor(h / 24);
    const m = Math.floor(d / 30);
    const y = Math.floor(d / 365);

    if (y > 0) return y === 1 ? "1 year ago" : `${y} years ago`;
    if (m > 0) return m === 1 ? "1 month ago" : `${m} months ago`;
    if (d > 0) return d === 1 ? "1 day ago" : `${d} days ago`;
    if (h > 0) return h === 1 ? "1 hour ago" : `${h} hours ago`;
    if (min > 0) return min === 1 ? "1 minute ago" : `${min} minutes ago`;
    return "Just now";
  }

  //────────────────────────────────────────────────────────────
  // UI
  //────────────────────────────────────────────────────────────

  return (
    <div
      className="
        flex flex-col h-screen p-3 
        bg-card text-card-foreground border-r border-border 
        w-[20%] min-w-[250px]
        max-md:w-full
      "
    >

      {/* SEARCH */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          placeholder="Search..."
          className="
            w-full pl-9 pr-3 py-1.5 
            bg-input border border-border 
            rounded-md text-sm 
            focus:outline-none focus:ring-1 focus:ring-primary
          "
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* FILTERS */}
      <div className="relative mb-3">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent" />
        
        <button
          onClick={() =>
            document.getElementById("filters-scroll")?.scrollBy({ left: -120, behavior: "smooth" })
          }
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1"
        >
          <ChevronLeft />
        </button>

        <div
          id="filters-scroll"
          className="flex gap-2 overflow-x-auto no-scrollbar px-10 py-1"
        >
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => toggleFilter(f.id)}
              className={`
                text-xs whitespace-nowrap px-2 py-1 rounded-md transition-colors
                ${
                  selectedFilters.includes(f.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />

        <button
          onClick={() =>
            document.getElementById("filters-scroll")?.scrollBy({ left: 120, behavior: "smooth" })
          }
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1"
        >
          <ChevronRight />
        </button>
      </div>

      {/* RESULTS */}
      <div className="overflow-y-auto pr-1 scrollbar h-[70vh]">
        {sorted.length ? (
          <div className="space-y-1 p-1">
            {sorted.map((r) => {
              const score = (r.note ?? 0) + (votes[r.id] ?? 0);
              const timeAgo = formatTimeAgo(r.created_at);

              return (
                <Link
                  key={r.id}
                  href={`/${r.id}`}
                  className={`
                    block rounded-md overflow-hidden relative
                    ${getColorClass(r.tag ?? "")}
                    bg-card border border-border shadow-sm
                    hover:shadow-lg hover:border-primary/40 hover:scale-[1.01]
                    transition-all
                  `}
                >
                  <div className="relative flex gap-3 p-3 z-10">

                    {/* VOTES */}
                    <div className="flex flex-col items-center w-10 shrink-0 mt-1">
                      <button
                        onClick={(e) => handleVoteClick(e, r, 1)}
                        className={`
                          w-7 h-7 flex items-center justify-center rounded-sm transition
                          ${
                            votes[r.id] === 1
                              ? "bg-primary text-black"
                              : "bg-muted hover:bg-muted/70"
                          }
                        `}
                      >
                        <ChevronUp size={14} />
                      </button>

                      <span className="text-sm font-bold py-1">{score}</span>

                      <button
                        onClick={(e) => handleVoteClick(e, r, -1)}
                        className={`
                          w-7 h-7 flex items-center justify-center rounded-sm transition
                          ${
                            votes[r.id] === -1
                              ? "bg-destructive text-white"
                              : "bg-muted hover:bg-muted/70"
                          }
                        `}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold tracking-wide uppercase line-clamp-2">
                          {r.title}
                        </h3>

                        {timeAgo && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                            <Clock size={11} />
                            {timeAgo}
                          </span>
                        )}
                      </div>

                      {r.description && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground/80 font-medium mt-1">
                          {r.description.length > 80
                            ? r.description.slice(0, 80) + "…"
                            : r.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border">
                          <Music2 size={11} />
                          {r.tag || "No tag"}
                        </span>

                        {typeof r.bpm === "number" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border">
                            {r.bpm} BPM
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                        </div>

                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>
                            {r.location != null
                              ? `Dept. ${r.location}`
                              : "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
            <p>No topics match your search</p>
          </div>
        )}
      </div>

      {/* CREATE NEW ROOT */}
      <div className="mt-4">
        <InlineRecorderButton
          parentId={null}
          isRoot={true}
          bpm={120}
          onCreated={(node) => setRoots((prev) => [node, ...prev])}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-md transition"
        />
      </div>
    </div>
  );
}