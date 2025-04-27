"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  description?: string;
  firstNode?: {
    instrument?: string;
    user_id?: string;
  };
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
    { id: 'synth', label: 'Synth' },
    { id: 'drums', label: 'Drums' },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const getColorClass = (instrument?: string) => {
    const lower = instrument?.toLowerCase();
    if (lower?.includes('guitar') || lower?.includes('bass')) return 'bg-green-700';
    if (lower?.includes('drum')) return 'bg-blue-700';
    if (lower?.includes('vocal')) return 'bg-pink-700';
    if (lower?.includes('synth') || lower?.includes('piano')) return 'bg-green-700';
    return 'bg-red-700';
  };

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search..."
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
              className={`text-xs px-2 py-1 transition-colors ${
                selectedFilters.includes(filter.id)
                  ? 'bg-yellow-700 text-yellow-100'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

      <div className="flex-1 overflow-y-auto">
        {filteredTopics.length > 0 ? (

          <div className="space-y-1 p-1">
            {filteredTopics.map((topic) => {
            const firstNode = topic.firstNode;
            const colorClass = getColorClass(firstNode?.instrument);
            
            

            return (
              <Link
                key={topic.id}
                href={`/topic/${topic.id}`}
                className={`block rounded-md overflow-hidden ${colorClass} hover:opacity-90 transition`} >
                <div className="flex items-center gap-2">
                  <span className={` ${colorClass} `}>
                    {topic.title}
                  </span>
                </div>
                {topic.description && (
                  <div className="px-3 pb-2 text-grey-900/70 font-medium">
                    {topic.description.length > 25
                      ? topic.description.slice(0, 25) + "..."
                      : topic.description}
                  </div>
                )}
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
    </div>
  );
}