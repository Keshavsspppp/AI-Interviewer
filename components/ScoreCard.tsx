'use client';

import React from 'react';
import ScoreRing from './ScoreRing';

interface ScoreCardProps {
  score: number;
}

export default function ScoreCard({ score }: ScoreCardProps) {
  return <ScoreRing score={score} />;
}
