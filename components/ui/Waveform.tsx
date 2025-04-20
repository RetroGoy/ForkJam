"use client";

import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  audioUrl: string;
  color?: string;
  height?: number;
  playing?: boolean;
}

export function Waveform({ 
  audioUrl, 
  color = '#10b981', 
  height = 60,
  playing = false
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioUrl) return;
    
    // Create audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    // Load audio data for visualization
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Draw function for canvas
    const draw = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Only animate if playing
      if (playing) {
        analyser.getByteFrequencyData(dataArray);
      }
      
      // Draw waveform bars
      const barWidth = width / bufferLength * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = playing 
          ? dataArray[i] / 255 * height 
          : (Math.sin(i * 0.2) * 0.3 + 0.5) * height * 0.5; // Static wave when not playing
        
        ctx.fillStyle = color;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    // Start drawing
    draw();
    
    // Handle play/pause
    if (playing) {
      audio.play().catch(err => console.error('Error playing audio:', err));
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Cleanup audio context connections
      source.disconnect();
      analyser.disconnect();
    };
  }, [audioUrl, color, playing]);

  return (
    <div className="relative w-full overflow-hidden rounded-md bg-black/20 backdrop-blur-sm">
      <canvas 
        ref={canvasRef} 
        height={height} 
        className="w-full"
      />
    </div>
  );
}