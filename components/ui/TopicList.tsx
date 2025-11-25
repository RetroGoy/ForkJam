"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, X, MousePointerClick } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Topic {
  id: string;
  title: string;
  description?: string;
  style?: string;
  bpm?: number;
  firstNode?: {
    instrument?: string;
    user_id?: string;
  };
}

interface TopicListProps {
  topics: Topic[];
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-xl w-full max-w-md p-6 relative shadow-lg">
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

export default function TopicList({ topics }: TopicListProps) {
  const router = useRouter();

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

  console.log("TOPICS RECEIVED:", topics);

  // ─── Helpers ───
  const filters = [
    { id: "recent", label: "Recent" },
    { id: "popular", label: "Popular" },
    ...styleOptions.map(s => ({ id: s, label: s })),
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => (prev.includes(filterId) ? prev.filter(id => id !== filterId) : [...prev, filterId]));
  };

  // ── couleurs par style ───────────────────────────────────────
  const getColorClass = (val?: string) => {
    const lower = val?.toLowerCase() ?? "";
    if (lower.includes("electro")) return "bg-red-700";   // Electro  → rouge
    if (lower.includes("jazz"))    return "bg-blue-700";  // Jazz     → bleu
    if (lower.includes("rock"))    return "bg-green-700"; // Rock     → vert
    return "bg-gray-700";                                 // fallback
  };

  const styleFilters = selectedFilters.filter(id => styleOptions.includes(id));

  const filteredTopics = topics
    .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()))  
    .filter(t => {                                                           
      if (styleFilters.length === 0) return true;
      const topicStyle = (t.style || t.firstNode?.instrument || "").toLowerCase();
      return styleFilters.some(sf => topicStyle.includes(sf.toLowerCase()));
    });
  

  // ─── BPM Tap logic ───
  const handleTap = () => {
    const now = Date.now();
    setClickTimes(prev => {
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

  // ─── Submit ───
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

    // success
    setLoading(false);
    setModalOpen(false);
    setTitle("");
    setDescription("");
    setClickTimes([]);
    router.push(`/topic/${newTopic.id}`);
  };

  // ─── UI ───
  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => toggleFilter(f.id)}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              selectedFilters.includes(f.id) ? "bg-yellow-700 text-yellow-100" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Topic list */}
      <div className="flex-1 overflow-y-auto">
        {filteredTopics.length ? (
          <div className="space-y-1 p-1">
            {filteredTopics.map(t => (
              <Link
                key={t.id}
                href={`/topic/${t.id}`}
                className={`block rounded-md overflow-hidden ${getColorClass(t.style)} hover:opacity-90 transition`}
              >
                <div className="flex items-center gap-2 p-2">
                  <span className="font-semibold text-sm capitalize">{t.title}</span>
                </div>
                {t.description && (
                  <div className="px-3 pb-2 text-gray-900/70 font-medium text-xs">
                    {t.description.length > 50 ? t.description.slice(0, 50) + "…" : t.description}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <p>No topics match your search</p>
          </div>
        )}

        {/* Create */}
        <div className="mt-4">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-md transition"
          >
            <Plus size={16} /> Create Topic
          </button>
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-lg font-semibold mb-4">Create a new topic</h2>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
            <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
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
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Topic title"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
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
              onChange={e => setStyle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {styleOptions.map(s => (
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
                onChange={e => setBpm(Number(e.target.value))}
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