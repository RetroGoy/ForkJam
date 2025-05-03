"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Save, X, Mic, Square, Loader2 } from "lucide-react";
import { AudioRecorder } from "@/lib/audioRecorder";
import { uploadAudioToSupabase } from "@/lib/uploadAudioToSupabase";
import { createNode } from "@/lib/createNode";

interface InlineNodeRecorderProps {
  parentId: string;
  topicId: string;
  userId: string;
  bpm: number;
  refreshNodes: () => void;
}

export function InlineNodeRecorder({
  parentId,
  topicId,
  userId,
  bpm,
  refreshNodes,
}: InlineNodeRecorderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [instrument, setInstrument] = useState("");
  const [gain, setGain] = useState(1);

  const [recorder] = useState(() => new AudioRecorder());
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<number | null>(null);

  // Handle start recording
  const handleRecord = async () => {
    const permission = await recorder.requestPermission();
    if (permission) {
      await recorder.start();
      setIsRecording(true);
      setElapsedTime(0);
      startTimer();
      startVisualizer();
    }
  };

  // Handle stop recording
  const handleStop = async () => {
    const data = await recorder.stop();
    setAudioUrl(data.url);
    setBlob(data.blob);
    setIsRecording(false);
    stopTimer();
    stopVisualizer();
  };

  // Save node
  const handleSave = async () => {
    if (!title || !instrument || !blob) return;
    setIsLoading(true);

    const audio_url = await uploadAudioToSupabase(blob);
    if (!audio_url) return;

    await createNode({
      title,
      instrument,
      bpm,
      topic_id: topicId,
      parent_node_id: parentId,
      audio_url,
      user_id: userId,
    });

    refreshNodes();
    resetRecorder();
  };

  // Reset recorder state
  const resetRecorder = () => {
    setIsOpen(false);
    setAudioUrl(null);
    setBlob(null);
    setTitle("");
    setInstrument("");
    setGain(1);
    setElapsedTime(0);
    setIsRecording(false);
    stopTimer();
    stopVisualizer();
  };

  // Timer functions
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Visualizer functions
  const startVisualizer = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      const bars = 20;
      const barWidth = (canvasRef.current!.width / bars) - 2;
      for (let i = 0; i < bars; i++) {
        const barHeight = Math.random() * canvasRef.current!.height;
        ctx.fillStyle = "#ef4444"; // Red
        ctx.fillRect(i * (barWidth + 2), canvasRef.current!.height - barHeight, barWidth, barHeight);
      }
      visualizerRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const stopVisualizer = () => {
    if (visualizerRef.current) cancelAnimationFrame(visualizerRef.current);
  };

  // UI
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 flex items-center justify-center bg-yellow-700 hover:bg-yellow-600 text-white"
      >
        <Plus size={18} />
      </button>
    );
  }

  return (
    <div className="p-4 bg-gray-800 border border-yellow-900/50 space-y-4">
      <div className="flex justify-between">
        <h3 className="text-yellow-400 font-bold">Add Node</h3>
        <button onClick={resetRecorder} className="text-red-400 hover:text-red-300">
          <X size={18} />
        </button>
      </div>

      {/* Title & Instrument */}
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 rounded-md text-sm"
      />
      <input
        placeholder="Instrument"
        value={instrument}
        onChange={(e) => setInstrument(e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 rounded-md text-sm"
      />

      {/* Visualizer Canvas */}
      <canvas
        ref={canvasRef}
        width={300}
        height={50}
        className="w-full bg-black/50 rounded-md"
      />

      {/* Timer */}
      <div className="text-center text-yellow-300 font-mono">
        {formatTime(elapsedTime)}
      </div>

      {/* Recorder Buttons */}
      <div className="flex gap-3">
        {!audioUrl && !isRecording && (
          <button
            onClick={handleRecord}
            className="flex-1 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md"
          >
            <Mic size={18} /> Start
          </button>
        )}
        {isRecording && (
          <button
            onClick={handleStop}
            className="flex-1 bg-yellow-700 hover:bg-yellow-800 text-white px-4 py-2 rounded-md"
          >
            <Square size={18} /> Stop
          </button>
        )}
      </div>

      {/* Audio Preview */}
      {audioUrl && (
        <audio controls src={audioUrl} className="w-full mt-4" />
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isLoading || !audioUrl || !title || !instrument}
        className="w-full flex items-center justify-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md disabled:opacity-40"
      >
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
        <span className="ml-2">Share</span>
      </button>

      {/* FUTURE: Timeline, Loop, Trim sections to insert here! */}
    </div>
  );
}
