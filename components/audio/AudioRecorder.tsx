"use client";

import React, { useState, useEffect } from 'react';
import { Mic, Square, Save, Trash2, Loader2 } from 'lucide-react';
import { AudioRecorder as AudioRecorderLib } from '@/lib/audioRecorder';
import { useAudioStore } from '@/store/useAudioStore';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onSave, onCancel }: AudioRecorderProps) {
  const [recorder, setRecorder] = useState<AudioRecorderLib | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  
  const { isRecording, setIsRecording, recordingData, setRecordingData } = useAudioStore();
  
  // Visualizer canvas refs
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const visualizerTimer = React.useRef<number | null>(null);
  
  // Initialize recorder and request permissions
  useEffect(() => {
    const initRecorder = async () => {
      setIsPreparing(true);
      const newRecorder = new AudioRecorderLib();
      const permissionGranted = await newRecorder.requestPermission();
      
      setHasPermission(permissionGranted);
      setRecorder(newRecorder);
      setIsPreparing(false);
    };
    
    initRecorder();
    
    return () => {
      if (recorder) {
        recorder.cleanup();
      }
    };
  }, []);
  
  // Update timer when recording
  useEffect(() => {
    if (isRecording) {
      const newTimer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      setTimer(newTimer);
      
      // Start visualizer
      startVisualizer();
    } else {
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
      
      // Stop visualizer
      if (visualizerTimer.current !== null) {
        cancelAnimationFrame(visualizerTimer.current);
        visualizerTimer.current = null;
      }
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
      
      if (visualizerTimer.current !== null) {
        cancelAnimationFrame(visualizerTimer.current);
      }
    };
  }, [isRecording]);
  
  const startRecording = () => {
    if (!recorder) return;
    
    setElapsedTime(0);
    recorder.start();
    setIsRecording(true);
  };
  
  const stopRecording = async () => {
    if (!recorder) return;
    
    try {
      const data = await recorder.stop();
      setRecordingData(data);
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };
  
  const cancelRecording = () => {
    if (!recorder) return;
    
    recorder.cancel();
    setIsRecording(false);
    setRecordingData(null);
    onCancel();
  };
  
  const handleSave = () => {
    if (!recordingData) return;
    
    onSave(recordingData.blob);
    setRecordingData(null);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Audio visualizer
  const startVisualizer = () => {
    if (!canvasRef.current || !recorder) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const drawVisualizer = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw a simple "active" visualizer when recording
      if (isRecording) {
        const numBars = 20;
        const barWidth = width / numBars - 2;
        
        for (let i = 0; i < numBars; i++) {
          // Generate random heights for the visualization effect
          const barHeight = Math.random() * height * 0.8;
          
          ctx.fillStyle = '#ef4444'; // Red color
          ctx.fillRect(
            i * (barWidth + 2) + 1, 
            height - barHeight, 
            barWidth, 
            barHeight
          );
        }
      }
      
      visualizerTimer.current = requestAnimationFrame(drawVisualizer);
    };
    
    drawVisualizer();
  };

  if (isPreparing) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-900 rounded-lg">
        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
        <p className="text-lg text-yellow-100">Preparing microphone...</p>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-900 rounded-lg">
        <div className="text-red-500 mb-4">
          <Mic className="w-12 h-12 mx-auto" />
          <span className="block w-12 h-0.5 bg-red-500 -mt-6 mx-auto transform rotate-45" />
        </div>
        <h3 className="text-xl font-bold text-red-300 mb-2">Microphone Access Denied</h3>
        <p className="text-gray-300 text-center">
          DRUIDE 500 needs microphone access to record audio.
          Please enable microphone access in your browser settings and reload the page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 border border-yellow-900/30 rounded-lg">
      <h3 className="text-xl font-bold mb-4 text-yellow-500 tracking-wider">RECORD YOUR RIFF</h3>
      
      <div className="mb-4">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={100} 
          className="w-full h-24 bg-black/50 rounded-md"
        />
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div className="text-2xl font-mono text-yellow-300">
          {formatTime(elapsedTime)}
        </div>
        
        <div 
          className={cn(
            "px-3 py-1 rounded-full font-medium",
            isRecording 
              ? "bg-red-700 text-white animate-pulse" 
              : recordingData 
                ? "bg-green-700 text-white" 
                : "bg-gray-700 text-gray-300"
          )}
        >
          {isRecording ? "RECORDING" : recordingData ? "READY" : "IDLE"}
        </div>
      </div>
      
      <div className="flex gap-3 justify-center">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded transition-colors"
          >
            <Square className="w-5 h-5" />
            <span>Stop Recording</span>
          </button>
        ) : recordingData ? (
          <>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Save Recording</span>
            </button>
            <button
              onClick={cancelRecording}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white py-2 px-4 rounded transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span>Discard</span>
            </button>
          </>
        ) : (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded transition-colors"
          >
            <Mic className="w-5 h-5" />
            <span>Start Recording</span>
          </button>
        )}
      </div>
    </div>
  );
}