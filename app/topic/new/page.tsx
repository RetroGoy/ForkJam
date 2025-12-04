"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { getTopics, supabase } from '@/lib/supabase/supabase';
import { useTopicStore } from '@/store/useTopicStore';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Topic } from '@/lib/supabase/supabase';

export default function NewTopicPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  
  // Fetch topics for the sidebar
  useEffect(() => {
    getTopics().then(fetchedTopics => {
      setTopics(fetchedTopics);
    });
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Create a new topic in Supabase
      const { data, error } = await supabase
        .from('topics')
        .insert([
          {
            title: formData.title,
            description: formData.description,
          },
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      // Navigate to the new topic page
      router.push(`/topic/${data.id}`);
    } catch (error) {
      console.error('Error creating topic:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-64 h-full">
        <Sidebar topics={topics} />
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-900 relative">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid-pattern" />
        
        <div className="relative p-8 max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-yellow-400 mb-6">
            <ArrowLeft size={16} className="mr-1" />
            <span>Back to Home</span>
          </Link>
          
          <div className="bg-gray-800/70 border border-yellow-900/30 rounded-lg p-6 backdrop-blur-sm">
            <h1 className="text-2xl font-bold mb-6 text-yellow-400">Create New Topic</h1>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Late Night Beats"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what kind of music you're looking to create..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-yellow-700 hover:bg-yellow-600 text-white py-3 px-4 rounded-md transition-colors disabled:bg-yellow-900 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Create Topic</span>
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="mt-6 text-gray-400 text-sm">
            <p>
              Creating a topic will start a new musical collaboration. Others will be able to
              build upon your initial recording to create musical branches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}