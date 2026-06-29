'use client';

import React, { useEffect, useRef, useState } from 'react';
import { InterviewStatus } from '@/lib/interviewStore';

interface WaveformVisualizerProps {
  status: InterviewStatus;
}

export default function WaveformVisualizer({ status }: WaveformVisualizerProps) {
  const [heights, setHeights] = useState<number[]>(Array(7).fill(15));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'speaking') {
      intervalRef.current = setInterval(() => {
        setHeights(Array(7).fill(0).map(() => Math.random() * 80 + 20));
      }, 150);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setHeights(Array(7).fill(15));
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  const isSpeaking = status === 'speaking';

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8 relative">
      {/* Ambient glow — breathes while speaking */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(79,142,247,0.15) 0%, transparent 70%)',
          animation: isSpeaking ? 'ambient-breathe 2s ease-in-out infinite' : 'none',
          opacity: isSpeaking ? undefined : 0.05,
          transition: 'opacity 0.6s ease',
        }}
      />

      {/* Avatar circle */}
      <div className="relative z-10">
        <div
          className="w-[120px] h-[120px] rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))',
            border: '2px solid var(--accent-primary)',
            boxShadow: isSpeaking ? '0 0 40px rgba(79,142,247,0.3)' : '0 0 20px rgba(79,142,247,0.1)',
            transition: 'box-shadow 0.6s ease',
          }}
        >
          {/* Stylized "A" */}
          <span
            className="font-display text-[40px] font-bold"
            style={{ color: 'var(--accent-primary)' }}
          >
            A
          </span>
        </div>
      </div>

      {/* Name */}
      <div className="text-center z-10">
        <h3 className="font-display text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Alex
        </h3>
        <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          AI Interviewer
        </p>
      </div>

      {/* Waveform bars — 7 bars */}
      <div className="flex items-end justify-center gap-[4px] h-[48px] z-10">
        {heights.map((h, i) => (
          <div
            key={i}
            style={{
              width: 3,
              borderRadius: 999,
              height: `${h}%`,
              backgroundColor: isSpeaking ? 'var(--accent-primary)' : 'var(--border-subtle)',
              transition: 'height 0.15s ease, background-color 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Status pill */}
      <StatusPill status={status} />
    </div>
  );
}

function StatusPill({ status }: { status: InterviewStatus }) {
  const config = {
    speaking: { label: 'Speaking', color: 'var(--accent-primary)', dotStyle: 'solid' as const },
    thinking: { label: 'Thinking...', color: 'var(--accent-warning)', dotStyle: 'spin' as const },
    listening: { label: 'Listening', color: 'var(--accent-success)', dotStyle: 'pulse' as const },
    setup: { label: 'Ready', color: 'var(--text-tertiary)', dotStyle: 'solid' as const },
    completed: { label: 'Complete', color: 'var(--text-tertiary)', dotStyle: 'solid' as const },
  }[status];

  return (
    <div
      className="pill z-10"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        color: config.color,
      }}
    >
      {/* Dot */}
      {config.dotStyle === 'pulse' ? (
        <span
          className="w-[6px] h-[6px] rounded-full"
          style={{
            backgroundColor: config.color,
            animation: 'mic-pulse 1.5s infinite',
          }}
        />
      ) : config.dotStyle === 'spin' ? (
        <span
          className="w-[10px] h-[10px] rounded-full"
          style={{
            border: `2px solid transparent`,
            borderTopColor: config.color,
            animation: 'spin-slow 0.8s linear infinite',
          }}
        />
      ) : (
        <span
          className="w-[6px] h-[6px] rounded-full"
          style={{ backgroundColor: config.color }}
        />
      )}
      <span className="font-body text-[11px] font-medium">{config.label}</span>
    </div>
  );
}
