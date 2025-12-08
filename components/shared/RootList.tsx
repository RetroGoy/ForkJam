"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  X,
  MousePointerClick,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ThumbsDown,
  User,
  MapPin,
  Clock,
  Music2,
} from "lucide-react";

import {
  supabase,
  getRootNodes,
  toggleNodeVote,
  createNode,
  type Node,
} from "@/lib/supabase/supabase";
import { InlineRecorderButton } from "../recorder/InlineRecorderButton";
import { getColorClass } from "@/lib/utils/getColorClass";

//────────────────────────────────────────────────────────────
// Modal
//────────────────────────────────────────────────────────────
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-background w-full max-w-md p-6 relative shadow-lg rounded-md">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

//────────────────────────────────────────────────────────────
// Date utils
//────────────────────────────────────────────────────────────
function formatTimeAgo(dateString?: string) {
  if (!dateString) return "";
  const created = new Date(dateString).getTime();
  if (Number.isNaN(created)) return "";
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
// RootList
//────────────────────────────────────────────────────────────
export default function RootList({
  initialRoots,
}: {
  initialRoots: Node[];
}) {
  const [roots, setRoots] = useState<Node[]>(initialRoots);

  const [currentLocation, setCurrentLocation] = useState<number | null>(null);
  useEffect(() => {
    const load = async () => {
      const data = await getRootNodes();
      if (data) setRoots(data);
    };
    load();
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("department")
        .eq("id", user.id)
        .single();

      const loc = data?.department ? Number(data.department) : null;
      setCurrentLocation(loc);
    };

    fetchLocation();
  }, []);

  //────────────────────────────────────────────────────────────
  // filters UI
  //────────────────────────────────────────────────────────────

  const styleOptions = ["Rock", "Electro", "Jazz", "Experimental"];

  const filters = [
    { id: "recent", label: "Recent" },
    { id: "popular", label: "Popular" },
    { id: "nearby", label: "Position" },
    ...styleOptions.map((s) => ({ id: s, label: s })),
  ];

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleFilter = (id: string) =>
    setSelectedFilters((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );

  const styleFilters = selectedFilters.filter((x) =>
    styleOptions.includes(x)
  );

  //────────────────────────────────────────────────────────────
  // votes store
  //────────────────────────────────────────────────────────────
  const [votes, setVotes] = useState<Record<string, number>>({});

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

  //────────────────────────────────────────────────────────────
  // children count (popularity)
  //────────────────────────────────────────────────────────────
  const [childrenCounts, setChildrenCounts] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const loadCounts = async () => {
      const { data } = await supabase
        .from("nodes")
        .select("id,parent_node_id");

      if (!data) return;

      const result: Record<string, number> = {};

      for (const n of data as { id: string; parent_node_id: string | null }[]) {
        if (!n.parent_node_id) continue;
        result[n.parent_node_id] = (result[n.parent_node_id] ?? 0) + 1;
      }

      setChildrenCounts(result);
    };

    loadCounts();
  }, []);

  //────────────────────────────────────────────────────────────
  // Filtering / sorting
  //────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return roots
      .filter((r) =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
      .filter((r) => {
        if (styleFilters.length === 0) return true;
        const tag = r.tag?.toLowerCase() ?? "";
        return styleFilters.some((sf) =>
          tag.includes(sf.toLowerCase())
        );
      });
  }, [roots, searchTerm, styleFilters]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const popular = selectedFilters.includes("popular");
    const recent = selectedFilters.includes("recent");
    const nearby = selectedFilters.includes("nearby");

    copy.sort((a, b) => {
      // near first
      if (nearby && currentLocation != null) {
        const aNear = a.location === currentLocation;
        const bNear = b.location === currentLocation;
        if (aNear && !bNear) return -1;
        if (!aNear && bNear) return 1;
      }

      // popularity
      if (popular) {
        const ca = childrenCounts[a.id] ?? 0;
        const cb = childrenCounts[b.id] ?? 0;
        if (ca !== cb) return cb - ca;
      }

      // recent
      if (recent) {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (da !== db) return db - da;
      }

      return 0;
    });

    return copy;
  }, [filtered, selectedFilters, childrenCounts, currentLocation]);

  //────────────────────────────────────────────────────────────
  // Voting handler
  //────────────────────────────────────────────────────────────
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

  //────────────────────────────────────────────────────────────
  // Create root modal

  const [form, setForm] = useState({
    title: "",
    description: "",
    tag: "Rock",
    bpm: 120,
  });

  //────────────────────────────────────────────────────────────
  // UI
  //────────────────────────────────────────────────────────────

  return (
    <div className="h-30 flex flex-col backdrop-blur-xs">

      {/* SEARCH */}
      <div className="relative mb-3">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          size={16}
        />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* FILTERS */}
      <div className="relative mb-3">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-gray-900 to-transparent" />
        <button
          onClick={() =>
            document
              .getElementById("filters-scroll")
              ?.scrollBy({ left: -120, behavior: "smooth" })
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
              className={`text-xs whitespace-nowrap px-2 py-1 rounded-md transition-colors ${
                selectedFilters.includes(f.id)
                  ? "bg-yellow-700 text-yellow-100"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-gray-900 to-transparent" />
        <button
          onClick={() =>
            document
              .getElementById("filters-scroll")
              ?.scrollBy({ left: 120, behavior: "smooth" })
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
              const children = childrenCounts[r.id] ?? 0;
              const timeAgo = formatTimeAgo(r.created_at);

              return (
                <Link
                  key={r.id}
                  href={`/${r.id}`}
                  className={`
                    block rounded-md overflow-hidden relative
                    ${getColorClass(r.tag ?? "")}
                    bg-gradient-to-br from-white/10 via-transparent to-black/50
                    border border-black/30 
                    shadow-[0_2px_6px_rgba(0,0,0,0.45)]
                    after:absolute after:inset-0 after:pointer-events-none
                    after:bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_35%,rgba(0,0,0,0.15)_100%)]
                    before:absolute before:inset-0 before:z-0 before:pointer-events-none
                    before:bg-[url('https://grainy-gradients.vercel.app/noise.svg')]
                    before:opacity-[0.08]
                    transition-all duration-200
                    hover:shadow-[0_4px_14px_rgba(255,255,255,0.20)]
                    hover:border-white/40
                    hover:scale-[1.015]
                  `}
                >
                  <div className="relative flex gap-3 p-3 z-10">

                    {/* VOTES */}
                    <div className="flex flex-col items-center w-10 shrink-0 mt-1">
                      <button
                        onClick={(e) => handleVoteClick(e, r, 1)}
                        className={`w-7 h-7 flex items-center justify-center rounded-sm transition ${
                          votes[r.id] === 1
                            ? "bg-yellow-500 text-black"
                            : "bg-black/30 hover:bg-black/40"
                        }`}
                      >
                        <ChevronUp size={14} />
                      </button>

                      <span className="text-sm font-bold py-1">
                        {score}
                      </span>

                      <button
                        onClick={(e) => handleVoteClick(e, r, -1)}
                        className={`w-7 h-7 flex items-center justify-center rounded-sm transition ${
                          votes[r.id] === -1
                            ? "bg-red-500 text-black"
                            : "bg-black/30 hover:bg-black/40"
                        }`}
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold tracking-wide uppercase leading-snug line-clamp-2">
                          {r.title}
                        </h3>

                        {timeAgo && (
                          <span className="flex items-center gap-1 text-[11px] opacity-80 whitespace-nowrap">
                            <Clock size={11} />
                            {timeAgo}
                          </span>
                        )}
                      </div>

                      {r.description && (
                        <p className="text-[11px] sm:text-xs text-gray-900/80 font-medium mt-1">
                          {r.description.length > 80
                            ? r.description.slice(0, 80) + "…"
                            : r.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/30 border border-white/10">
                          <Music2 size={11} />
                          {r.tag || "No tag"}
                        </span>

                        {typeof r.bpm === "number" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/20 border border-white/10">
                            {r.bpm} BPM
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] sm:text-xs opacity-90">
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
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <p>No topics match your search</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <InlineRecorderButton
          parentId={null}
          isRoot={true}
          bpm={120}
          onCreated={(node) => setRoots(prev => [node, ...prev])}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-md transition"
        />
      </div>

    </div>
  );
}