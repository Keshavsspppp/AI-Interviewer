'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

interface FeedbackSectionProps {
  strengths: string[];
  improvements: string[];
  watch_out_for: string[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  }),
};

export default function FeedbackSection({ strengths, improvements, watch_out_for }: FeedbackSectionProps) {
  const cards = [
    {
      title: 'Strengths',
      items: strengths,
      icon: CheckCircle,
      accentColor: 'var(--accent-success)',
      accentBg: 'rgba(34,197,94,0.1)',
      dotColor: 'var(--accent-success)',
    },
    {
      title: 'Areas to Improve',
      items: improvements,
      icon: TrendingUp,
      accentColor: 'var(--accent-primary)',
      accentBg: 'rgba(79,142,247,0.1)',
      dotColor: 'var(--accent-primary)',
    },
    {
      title: 'Watch Out For',
      items: watch_out_for,
      icon: AlertTriangle,
      accentColor: 'var(--accent-warning)',
      accentBg: 'rgba(245,158,11,0.1)',
      dotColor: 'var(--accent-warning)',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            className="card overflow-hidden flex flex-col"
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            {/* Colored header bar */}
            <div
              className="h-[3px] w-full"
              style={{ background: card.accentColor }}
            />

            <div className="p-5 flex flex-col gap-4 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: card.accentBg }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: card.accentColor }} />
                </div>
                <h3 className="font-display text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {card.title}
                </h3>
              </div>

              <ul className="flex flex-col gap-2.5">
                {card.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <span
                      className="w-[5px] h-[5px] rounded-full mt-[7px] flex-shrink-0"
                      style={{ background: card.dotColor }}
                    />
                    <span className="font-body text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
