'use client';

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

interface Breakdown {
  technical_depth: number;
  communication: number;
  problem_solving: number;
  confidence: number;
  relevance: number;
}

interface BreakdownChartProps {
  breakdown: Breakdown;
}

export default function BreakdownChart({ breakdown }: BreakdownChartProps) {
  const data = [
    { subject: 'Technical Depth', value: breakdown.technical_depth, max: 20 },
    { subject: 'Communication', value: breakdown.communication, max: 20 },
    { subject: 'Problem Solving', value: breakdown.problem_solving, max: 20 },
    { subject: 'Confidence', value: breakdown.confidence, max: 20 },
    { subject: 'Relevance', value: breakdown.relevance, max: 20 },
  ];

  return (
    <div className="card p-6">
      <h3
        className="font-display text-[13px] font-semibold uppercase tracking-wider mb-4"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="var(--border-subtle)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: 'var(--text-tertiary)',
              fontSize: 11,
              fontFamily: 'var(--font-body)',
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 20]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="var(--accent-primary)"
            fill="var(--accent-primary)"
            fillOpacity={0.3}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Score grid below chart */}
      <div className="grid grid-cols-1 gap-2 mt-4">
        {data.map((d) => (
          <div key={d.subject} className="flex items-center justify-between px-2 py-1.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{d.subject}</span>
            <span className="font-mono text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {d.value}<span style={{ color: 'var(--text-tertiary)' }}> / {d.max}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
