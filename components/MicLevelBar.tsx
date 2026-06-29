'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MicLevelBarProps {
  stream: MediaStream | null;
}

export default function MicLevelBar({ stream }: MicLevelBarProps) {
  const [level, setLevel] = useState(0);
  const animRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentLevelRef = useRef(0);

  useEffect(() => {
    if (!stream) return;

    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      function tick() {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average amplitude
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const target = Math.min(100, (avg / 128) * 100);

        // Lerp for smooth animation
        currentLevelRef.current += (target - currentLevelRef.current) * 0.15;
        setLevel(currentLevelRef.current);

        animRef.current = requestAnimationFrame(tick);
      }

      animRef.current = requestAnimationFrame(tick);

      return () => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        audioCtx.close();
      };
    } catch (e) {
      console.error('MicLevelBar: Audio context error', e);
    }
  }, [stream]);

  return (
    <div className="w-full" style={{ height: 3, background: 'var(--bg-subtle)', borderRadius: 999 }}>
      <div
        style={{
          height: '100%',
          width: `${level}%`,
          background: 'var(--accent-primary)',
          borderRadius: 999,
          transition: 'width 0.05s linear',
        }}
      />
    </div>
  );
}
