import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

type SfxType = 'click' | 'success' | 'error' | 'complete' | 'hover' | 'notification';

interface AudioContextType {
  muted: boolean;
  toggleMute: () => void;
  playSfx: (type: SfxType) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(() => {
    const saved = localStorage.getItem('audio_muted');
    return saved ? JSON.parse(saved) : false;
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('audio_muted', JSON.stringify(muted));
  }, [muted]);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0) => {
    if (muted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

    gain.gain.setValueAtTime(0.1, ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  };

  const playSfx = (type: SfxType) => {
    initAudio();
    if (muted) return;

    switch (type) {
      case 'click':
        playTone(400, 'sine', 0.1);
        break;
      case 'hover':
        playTone(200, 'sine', 0.05);
        break;
      case 'success':
        playTone(600, 'sine', 0.1);
        playTone(800, 'sine', 0.1, 0.1);
        break;
      case 'error':
        playTone(300, 'sawtooth', 0.2);
        playTone(200, 'sawtooth', 0.2, 0.1);
        break;
      case 'complete':
        playTone(400, 'sine', 0.1);
        playTone(600, 'sine', 0.1, 0.1);
        playTone(800, 'sine', 0.2, 0.2);
        playTone(1000, 'sine', 0.4, 0.3);
        break;
      case 'notification':
        playTone(500, 'sine', 0.1);
        playTone(1000, 'sine', 0.1, 0.1);
        break;
    }
  };

  return (
    <AudioContext.Provider value={{ muted, toggleMute: () => setMuted(!muted), playSfx }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
