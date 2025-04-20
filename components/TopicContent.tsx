"use client";

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { NodeGraph } from '@/components/ui/NodeGraph';
import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { Topic, Node, getTopics, createNode, uploadAudio } from '@/lib/supabase';
import { useTopicStore } from '@/store/useTopicStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Plus, X, Music } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface TopicContentProps {
  initialTopic: Topic;
  initialNodes: Node[];
}

export function TopicContent({ initialTopic, initialNodes }: TopicContentProps) {
  const { topics, setTopics } = useTopicStore(state => ({ 
    topics: state.topics, 
    setTopics: (topics: Topic[]) => state.topics = topics 
  }));
  
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentNode, setParentNode] = useState<Node | null>(null);
  const [newNodeData, setNewNodeData] = useState({
    title: '',
    bpm: 120,
    instrument: 'Synth',
  });
  
  // Initialize topics if not already set
  useEffect(() => {
    if (topics.length === 0) {
      getTopics().then(fetchedTopics => {
        setTopics(fetchedTopics);
      });
    }
  }, []);
  
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
      const fileName = `${uuidv4()}.webm`;
      const filePath = `${topic.id}/${fileName}`;
      
      // Upload the audio file to Supabase storage
      const audioUrl = await uploadAudio(blob, filePath);
      
      if (!audioUrl) {
        throw new Error('Failed to upload audio');
      }
      
      // Create a new node in the database
      const newNode: Omit<Node, 'id' | 'created_at'> = {
        title: newNodeData.title || 'Untitled Node',
        audio_url: audioUrl,
        bpm: newNodeData.bpm,
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
        bpm: 120,
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
      <div className="w-64 h-full">
        <Sidebar topics={topics} />
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {/* The main topic view with node graph */}
        <div className="h-full">
          <NodeGraph 
            nodes={nodes} 
            onNodeSelect={handleNodeSelect} 
            onAddChild={handleAddChildClick}
          />
        </div>
        
        {/* New node recording modal */}
        {isRecording && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-gray-900 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-yellow-500">
                  {parentNode ? `Adding to: ${parentNode.title}` : 'New Root Node'}
                </h3>
                <button 
                  onClick={handleCancelRecording}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Title
                    </label>
                    <input 
                      type="text" 
                      placeholder="Enter a title for your riff"
                      value={newNodeData.title}
                      onChange={(e) => setNewNodeData({...newNodeData, title: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        BPM
                      </label>
                      <input 
                        type="number" 
                        min="40" 
                        max="240"
                        value={newNodeData.bpm}
                        onChange={(e) => setNewNodeData({...newNodeData, bpm: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Instrument
                      </label>
                      <select 
                        value={newNodeData.instrument}
                        onChange={(e) => setNewNodeData({...newNodeData, instrument: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
                      >
                        <option value="Synth">Synth</option>
                        <option value="Piano">Piano</option>
                        <option value="Guitar">Guitar</option>
                        <option value="Bass">Bass</option>
                        <option value="Drums">Drums</option>
                        <option value="Vocals">Vocals</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <AudioRecorder 
                  onSave={handleSaveRecording} 
                  onCancel={handleCancelRecording} 
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Floating action button for recording a new root node */}
        {!isRecording && (
          <button
            onClick={() => {
              setParentNode(null);
              setIsRecording(true);
            }}
            className="absolute right-6 bottom-6 bg-yellow-600 hover:bg-yellow-500 text-white rounded-full p-3 shadow-lg"
          >
            <Plus size={24} />
          </button>
        )}
        
        {/* Topic info header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-gray-900/80 to-transparent p-4">
          <div className="flex items-center">
            <Music className="text-yellow-500 mr-2" size={20} />
            <h1 className="text-xl font-bold text-yellow-100">{topic.title}</h1>
            {topic.description && (
              <span className="ml-4 text-sm text-gray-300">{topic.description}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}