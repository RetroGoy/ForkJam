"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  X,
  MousePointerClick,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  User,
  MapPin,
  Clock,
  Music2,
} from "lucide-react";
import { supabase, toggleTopicVote } from "@/lib/supabase";

interface TopicUser {
  id: string;
  username?: string;
  email?: string;
  department?: string | null;
}

interface Topic {
  id: string;
  title: string;
  description?: string;
  style?: string;
  bpm?: number;
  created_at?: string;
  user_id?: string;
  note?: number;
  users?: TopicUser | null;
}

interface TopicListProps {
  topics: Topic[];
}

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
      <div className="bg-gray-900 w-full max-w-md p-6 relative shadow-lg">
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

// format "il y a 3 jours" en anglais pour rester cohérent avec l’UI
function formatTimeAgo(dateString?: string) {
  if (!dateString) return "";
  const created = new Date(dateString).getTime();
  if (Number.isNaN(created)) return "";
  const now = Date.now();
  const diffMs = now - created;

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

export default function TopicList({ topics }: TopicListProps) {
  const router = useRouter();
  const [currentDepartment, setCurrentDepartment] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserDepartment = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("department")
        .eq("id", user.id)
        .single();

      setCurrentDepartment(data?.department ?? null);
    };

    fetchUserDepartment();
  }, []);

  // Search / filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Modal + form state
  const [modalOpen, setModalOpen] = useState(false);
  const styleOptions = ["Rock", "Electro", "Jazz", "Experimental"];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState(styleOptions[0]);
  const [bpm, setBpm] = useState(120);
  const [clickTimes, setClickTimes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Stats & votes pour les topics
  const [topicNodeCounts, setTopicNodeCounts] = useState<Record<string, number>>(
    {}
  );
  const [topicUserVotes, setTopicUserVotes] = useState<
    Record<string, 1 | -1 | 0>
  >({});

  console.log("TOPICS RECEIVED:", topics);

  // ─── Helpers
  const filters = [
    { id: "recent", label: "Recent" },
    { id: "popular", label: "Popular" },
    { id: "nearby", label: "Position" },
    ...styleOptions.map((s) => ({ id: s, label: s })),
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  // couleurs par style
  const getColorClass = (val?: string) => {
    const lower = val?.toLowerCase() ?? "";
    if (lower.includes("electro")) return "bg-red-700";
    if (lower.includes("jazz")) return "bg-blue-700";
    if (lower.includes("rock")) return "bg-green-700";
    return "bg-gray-700";
  };

  const styleFilters = selectedFilters.filter((id) =>
    styleOptions.includes(id)
  );

  // ─── Charge les stats globales (node count) + les votes utilisateur pour les topics
  useEffect(() => {
    if (!topics.length) return;

    const fetchStatsAndVotes = async () => {
      try {
        // 1. Nombre de nodes par topic (1 seule requête)
        const { data: nodesData, error: nodesError } = await supabase
          .from("nodes")
          .select("id, topic_id");

        if (nodesError) {
          console.error("Error fetching node counts for topics:", nodesError);
        } else if (nodesData) {
          const counts: Record<string, number> = {};
          for (const n of nodesData as { id: string; topic_id: string }[]) {
            counts[n.topic_id] = (counts[n.topic_id] ?? 0) + 1;
          }
          setTopicNodeCounts(counts);
        }

        // 2. Votes de l'utilisateur sur les topics
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: votesData, error: votesError } = await supabase
          .from("votes")
          .select("target_id, value")
          .eq("user_id", user.id)
          .eq("target_type", "topic");

        if (votesError) {
          console.error("Error fetching topic votes:", votesError);
        } else if (votesData) {
          const votesMap: Record<string, 1 | -1 | 0> = {};
          for (const v of votesData as { target_id: string; value: 1 | -1 }[]) {
            votesMap[v.target_id] = v.value;
          }
          setTopicUserVotes(votesMap);
        }
      } catch (err) {
        console.error("Error loading topic stats/votes:", err);
      }
    };

    fetchStatsAndVotes();
  }, [topics]);

  const filteredTopics = useMemo(() => {
    return topics
      .filter((t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
      .filter((t) => {
        if (styleFilters.length === 0) return true;
        const topicStyle = (
          t.style ||
          "" // plus tard tu pourras fallback sur firstNode.instrument si tu le renvoies ici
        ).toLowerCase();
        return styleFilters.some((sf) =>
          topicStyle.includes(sf.toLowerCase())
        );
      });
  }, [topics, searchTerm, styleFilters]);

  const sortedTopics = useMemo(() => {
    const popular = selectedFilters.includes("popular");
    const recent = selectedFilters.includes("recent");

    const copy = [...filteredTopics];
    const nearby = selectedFilters.includes("nearby");

    copy.sort((a, b) => {
      // 1) POSITION FIRST
      if (nearby && currentDepartment) {
        const aMatch = a.users?.department === currentDepartment;
        const bMatch = b.users?.department === currentDepartment;

        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
      }

      // 2) POPULAR
      if (popular) {
        const countA = topicNodeCounts[a.id] ?? 0;
        const countB = topicNodeCounts[b.id] ?? 0;
        if (countA !== countB) return countB - countA;
      }

      // 3) RECENT
      if (recent) {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (da !== db) return db - da;
      }

      return 0;
    });
    copy.sort((a, b) => {
      if (popular) {
        const countA = topicNodeCounts[a.id] ?? 0;
        const countB = topicNodeCounts[b.id] ?? 0;
        if (countA !== countB) return countB - countA;
      }

      if (recent) {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (da !== db) return db - da;
      }

      return 0;
    });

    return copy;
  }, [filteredTopics, selectedFilters, topicNodeCounts]);

  // BPM Tap logic
  const handleTap = () => {
    const now = Date.now();
    setClickTimes((prev) => {
      const times = [...prev, now].slice(-6);
      if (times.length >= 2) {
        const intervals = times.slice(1).map((t, i) => t - times[i]);
        const avg = intervals.reduce((a, b) => a + b) / intervals.length;
        const newBpm = Math.round(60000 / avg);
        if (newBpm) setBpm(newBpm);
      }
      return times;
    });
  };

  // ─── Submit création topic ───
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;

    const { data, error } = await supabase
      .from("topics")
      .insert({ title, description, style, bpm, user_id: userId })
      .select();

    const newTopic = data?.[0];
    if (error || !newTopic) {
      console.error("Topic insert failed", error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setModalOpen(false);
    setTitle("");
    setDescription("");
    setClickTimes([]);
    router.push(`/topic/${newTopic.id}`);
  };

  // ─── Gestion votes topics ───
  const handleTopicVoteClick = async (
    e: React.MouseEvent,
    topic: Topic,
    desiredValue: 1 | -1
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const current = topicUserVotes[topic.id] ?? 0;
    const next = current === desiredValue ? 0 : desiredValue;

    // Update UI tout de suite
    setTopicUserVotes((prev) => ({
      ...prev,
      [topic.id]: next,
    }));

    // Gère la ligne dans "votes" (supprime si même valeur, change sinon)
    await toggleTopicVote(topic.id, desiredValue);
  };

  // ─── UI ───
  return (
    <div className="h-30 flex flex-col">
      {/* Search */}
      <div className="relative mb-3">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          size={16}
        />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filters (horizontal scroll + arrows) */}
      <div className="relative mb-3">
        {/* Left fade + arrow */}
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

        {/* Scroll container */}
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

        {/* Right fade + arrow */}
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

      {/* Topic list */}
      <div className="overflow-y-auto pr-1 scrollbar max-h-[50vh] md:max-h-[50vh] lg:max-h-[50vh]">
        {sortedTopics.length ? (
          <div className="space-y-1 p-1">
            {sortedTopics.map((t) => {
              const nodeCount = topicNodeCounts[t.id] ?? 0;
              const userVote = topicUserVotes[t.id] ?? 0;
              const baseScore = t.note ?? 0;
              const score = baseScore + userVote;

              const username = t.users?.username ?? "Unknown";
              const location = t.users?.department
                ? `Dept. ${t.users.department}`
                : "Unknown";
              const timeAgo = formatTimeAgo(t.created_at);

              return (
                <Link
                  key={t.id}
                  href={`/topic/${t.id}`}
                  className={`
                    block rounded-md overflow-hidden relative
                    ${getColorClass(t.style)}

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
                    {/* VOTES COLUMN */}
                    <div className="flex flex-col items-center w-10 shrink-0 mt-1">
                      <button
                        onClick={(e) =>
                          handleTopicVoteClick(e, t, 1)
                        }
                        className={`w-7 h-7 flex items-center justify-center rounded-sm transition ${
                          userVote === 1
                            ? "bg-yellow-500 text-black"
                            : "bg-black/30 hover:bg-black/40"
                        }`}
                      >
                        <ThumbsUp size={14} />
                      </button>

                      <span className="text-sm font-bold py-1">
                        {score}
                      </span>

                      <button
                        onClick={(e) =>
                          handleTopicVoteClick(e, t, -1)
                        }
                        className={`w-7 h-7 flex items-center justify-center rounded-sm transition ${
                          userVote === -1
                            ? "bg-red-500 text-black"
                            : "bg-black/30 hover:bg-black/40"
                        }`}
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      {/* Title + date */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold tracking-wide uppercase leading-snug line-clamp-2">
                          {t.title}
                        </h3>
                        {timeAgo && (
                          <span className="flex items-center gap-1 text-[11px] opacity-80 whitespace-nowrap">
                            <Clock size={11} />
                            {timeAgo}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {t.description && (
                        <p className="text-[11px] sm:text-xs text-gray-900/80 font-medium mt-1">
                          {t.description.length > 80
                            ? t.description.slice(0, 80) + "…"
                            : t.description}
                        </p>
                      )}

                      {/* Tags : style, BPM, nodes */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/30 border border-white/10">
                          <Music2 size={11} />
                          {t.style || "No style"}
                        </span>
                        {typeof t.bpm === "number" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/20 border border-white/10">
                            {t.bpm} BPM
                          </span>
                        )}
                      </div>

                      {/* User + location */}
                      <div className="mt-2 flex items-center justify-between text-[11px] sm:text-xs opacity-90">
                        <div className="flex items-center gap-1 min-w-0">
                          <User size={12} />
                          <span className="truncate">{username}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin size={12} />
                          <span className="truncate">{location}</span>
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

      {/* Create */}
      <div className="mt-4">
        <button
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-md transition"
        >
          <Plus size={16} /> Create Topic
        </button>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-lg font-semibold mb-4">Create a new topic</h2>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
            <svg
              className="animate-spin h-6 w-6 text-white"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                d="M22 12a10 10 0 00-10-10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Topic title"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              rows={3}
              placeholder="Few words about the topic"
            />
          </div>

          {/* Style */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {styleOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* BPM */}
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              BPM <span className="text-xs text-gray-400">(tap to set)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-24 bg-gray-800 border border-gray-700 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleTap}
                className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm"
              >
                <MousePointerClick size={16} /> Tap
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-4 py-2 text-sm rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}