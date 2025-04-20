"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Music, Filter } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  description?: string;
}

interface TopicListProps {
  topics: Topic[];
}

export function TopicList({ topics }: TopicListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filters = [
    { id: 'recent', label: 'Recent' },
    { id: 'popular', label: 'Popular' },
    { id: 'guitar', label: 'Guitar' },
    { id: 'synth', label: 'Synth' },
    { id: 'drums', label: 'Drums' },
    { id: 'bass', label: 'Bass' },
    { id: 'vocals', label: 'Vocals' },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log("RECEIVED TOPICS:", topics);

  return (
    <div className="h-full flex flex-col bg-gray-900/50">
      <div className="p-3 border-b border-yellow-900/30">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                selectedFilters.includes(filter.id)
                  ? 'bg-yellow-700 text-yellow-100'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredTopics.length > 0 ? (
          <div className="space-y-1 p-2">
            {filteredTopics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topic/${topic.id}`}
                className="block p-2 hover:bg-gray-800 rounded-md group transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Music size={14} className="text-yellow-500" />
                  <span className="text-gray-200 group-hover:text-yellow-400 transition-colors">
                    {topic.title}
                  </span>
                </div>
                {topic.description && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    {topic.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <Filter size={24} className="mb-2" />
            <p>No topics match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}