"use client";

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { NodeGraph } from '@/components/ui/NodeGraph';
import { Topic, Node, getTopics, createNode, uploadAudio } from '@/lib/supabase';
import { useTopicStore } from '@/store/useTopicStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Plus, X, Music } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Header } from '@/components/layout/Header';

interface TopicContentProps {
  initialTopic: Topic;
  initialNodes: Node[];
}

export function TopicContent({ initialTopic, initialNodes }: TopicContentProps) {
  const { topics, setTopics } = useTopicStore(state => ({ 
    topics: state.topics, 
    setTopics: (topics: Topic[]) => state.topics = topics 
  }));
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentNode, setParentNode] = useState<Node | null>(null);
  const [newNodeData, setNewNodeData] = useState({
    title: '',
    instrument: 'Synth',
  });
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
  
    getUser();
  }, [setTopics, topics]);

  // Initialize topics if not already set
  useEffect(() => {
    if (topics.length === 0) {
      getTopics().then(fetchedTopics => {
        setTopics(fetchedTopics);
      });
    }
  }, [setTopics, topics]);
  
  const handleNodeSelect = (node: Node) => {
    setSelectedNode(node);
  };
  
  const handleAddChildClick = (node: Node) => {
    setParentNode(node);
    setIsRecording(true);
  };
  
  const handleSaveRecording = async (blob: Blob) => {
    if (!parentNode && !topic) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate a unique path for the audio file
      const fileName = `${uuidv4()}.mp3`;
      const filePath = `${topic.id}/${fileName}`;
      
      // Upload the audio file to Supabase storage
      const audioUrl = await uploadAudio(blob, filePath);
      
      if (!audioUrl) {
        throw new Error('Failed to upload audio');
      }
      
      // Create a new node in the database
      const newNode: Omit<Node, 'id' | 'created_at'> = {
        title: newNodeData.title || 'Untitled',
        audio_url: audioUrl,
        instrument: newNodeData.instrument,
        topic_id: topic.id,
        parent_node_id: parentNode ? parentNode.id : null,
        user_id: 'anonymous', // Replace with actual user ID when auth is implemented
      };
      
      const createdNode = await createNode(newNode);
      
      if (createdNode) {
        // Add the new node to the local state
        setNodes(prev => [...prev, createdNode]);
      }
      
      // Reset state
      setIsRecording(false);
      setParentNode(null);
      setNewNodeData({
        title: '',
        instrument: 'Synth',
      });
    } catch (error) {
      console.error('Error saving recording:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelRecording = () => {
    setIsRecording(false);
    setParentNode(null);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-hidden bg-gray-800 relative">

        <div className='z-10'>
          <Header />
        </div>
        <div className="flex">
          <div className='z-10'>
            <Sidebar topics={topics} />
          </div>
          <div className='z-0'>
            <NodeGraph
              nodes={nodes}
              onNodeSelect={handleNodeSelect}
              onAddChild={handleAddChildClick}
              topic={topic}
              user={currentUser}
              refreshNodes={async () => {
                const { data: refreshedNodes } = await supabase
                  .from('nodes')
                  .select('*')
                  .eq('topic_id', topic.id);
                if (refreshedNodes) setNodes(refreshedNodes);
              }} />
        
              <div className="top-0 left-0 right-0 p-4">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-yellow-100">{topic.title}</h1>
                  {topic.description && (
                    <span className="ml-4 text-sm text-gray-300">{topic.description}</span>
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}