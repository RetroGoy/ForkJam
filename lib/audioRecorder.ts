"use client";

export interface RecordingOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
}

export interface RecordingData {
  blob: Blob;
  url: string;
  duration: number;
}

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private options: RecordingOptions;

  constructor(options: RecordingOptions = {}) {
    this.options = {
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000,
      ...options,
    };
  }

  async requestPermission(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return false;
    }
  }

  start(): boolean {
    if (!this.stream) {
      console.error('No audio stream available. Call requestPermission() first.');
      return false;
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, this.options);
      this.chunks = [];
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };
      
      this.startTime = Date.now();
      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  stop(): Promise<RecordingData> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('Recorder is not active'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const duration = (Date.now() - this.startTime) / 1000;
        const blob = new Blob(this.chunks, { type: this.options.mimeType });
        const url = URL.createObjectURL(blob);
        
        resolve({ blob, url, duration });
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.chunks = [];
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}

export function createWaveformData(audioBuffer: AudioBuffer, numPoints: number = 100): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / numPoints);
  const waveform = [];

  for (let i = 0; i < numPoints; i++) {
    const blockStart = blockSize * i;
    let sum = 0;
    
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[blockStart + j] || 0);
    }
    
    const average = sum / blockSize;
    waveform.push(average);
  }

  return waveform;
}

export async function createAudioBuffer(audioUrl: string): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    const audioContext = new AudioContext();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Error creating audio buffer:', error);
    return null;
  }
}