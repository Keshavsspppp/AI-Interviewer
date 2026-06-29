'use client';

import React, { useEffect, useState, useRef } from 'react';

interface ScoreRingProps {
  score: number;
}

export default function ScoreRing({ score }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [mounted, setMounted] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  // Determine color based on score
  const getColor = (s: number) => {
    if (s >= 80) return 'var(--accent-success)';
    if (s >= 60) return 'var(--accent-warning)';
    return 'var(--accent-danger)';
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    return 'Needs Work';
  };

  // Count-up animation
  useEffect(() => {
    setMounted(true);
    const duration = 1500;

    function animate(timestamp: number) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out curve
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(easedProgress * score));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [score]);

  const radius = 54;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = mounted ? circumference * (1 - score / 100) : circumference;
  const color = getColor(score);

  return (
    <div className="card p-8 flex flex-col items-center justify-center gap-4">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
          />
          {/* Foreground ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          />
        </svg>
        {/* Score number centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-bold"
            style={{ fontSize: 48, lineHeight: 1, color }}
          >
            {displayScore}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>out of 100</p>
        <p className="font-display text-[16px] font-semibold mt-1" style={{ color }}>
          {getLabel(score)}
        </p>
      </div>
    </div>
  );
}
