'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronDown, Check, ArrowRight, HelpCircle, Code, Bot, BarChart3, Target } from 'lucide-react';
import { useInterviewStore } from '@/lib/interviewStore';
import dynamic from 'next/dynamic';

const WebcamFeed = dynamic(() => import('./WebcamFeed'), { ssr: false });

const ROLES = [
  { id: 'Software Engineer', icon: Code, label: 'Software Engineer' },
  { id: 'ML Engineer', icon: Bot, label: 'ML Engineer' },
  { id: 'Data Analyst', icon: BarChart3, label: 'Data Analyst' },
  { id: 'Product Manager', icon: Target, label: 'Product Manager' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const TYPES = ['Technical', 'Behavioral', 'Mixed'];

export default function SetupForm() {
  const router = useRouter();
  const { setConfig } = useInterviewStore();

  const [role, setRole] = useState(ROLES[0].id);
  const [difficulty, setDifficulty] = useState('Medium');
  const [interviewType, setInterviewType] = useState('Mixed');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [devicesReady, setDevicesReady] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedRole = ROLES.find(r => r.id === role) || ROLES[0];

  const handleStart = () => {
    setConfig(role, difficulty, interviewType);
    router.push('/interview');
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
            <span className="font-display text-[14px] font-bold text-white">A</span>
          </div>
          <span className="font-display text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>InterviewAI</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-[13px] font-medium" style={{ color: 'var(--text-tertiary)' }}>How it works</button>
          <button className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <HelpCircle className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          className="w-full"
          style={{ maxWidth: 1280 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Eyebrow */}
          <p
            className="font-mono text-[11px] font-medium tracking-wider uppercase mb-3 text-center"
            style={{ color: 'var(--accent-primary)' }}
          >
            ✦ Ready when you are
          </p>

          {/* Headline */}
          <h1
            className="font-display text-center mb-12"
            style={{ fontSize: 48, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.15 }}
          >
            Practice interviews that feel real.
          </h1>

          {/* Two-column cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camera Preview Card */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="w-2 h-2 rounded-sm" style={{ background: 'var(--accent-primary)' }} />
                </div>
                <span className="font-display text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Camera Preview
                </span>
              </div>
              <WebcamFeed
                onStreamReady={() => setDevicesReady(true)}
                onError={() => setDevicesReady(false)}
              />
            </div>

            {/* Interview Setup Card */}
            <div className="card p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="w-2 h-2 rounded-sm" style={{ background: 'var(--accent-primary)' }} />
                </div>
                <span className="font-display text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Interview Setup
                </span>
              </div>

              <div className="flex flex-col gap-6 flex-1">
                {/* Role Dropdown — Custom */}
                <div className="flex flex-col gap-2">
                  <label className="font-body text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    Target Role
                  </label>
                  <div ref={dropdownRef} className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer"
                      style={{
                        background: 'var(--bg-subtle)',
                        border: dropdownOpen ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <selectedRole.icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                        <span className="font-body text-[14px]" style={{ color: 'var(--text-primary)' }}>{selectedRole.label}</span>
                      </div>
                      <ChevronDown
                        className="w-4 h-4 transition-transform"
                        style={{
                          color: 'var(--text-tertiary)',
                          transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </button>

                    {/* Dropdown panel */}
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50"
                        style={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-active)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        }}
                      >
                        {ROLES.map((r) => {
                          const Icon = r.icon;
                          const isSelected = r.id === role;
                          return (
                            <button
                              key={r.id}
                              onClick={() => { setRole(r.id); setDropdownOpen(false); }}
                              className="w-full flex items-center justify-between px-3.5 cursor-pointer"
                              style={{
                                height: 40,
                                background: isSelected ? 'var(--bg-subtle)' : 'transparent',
                                color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className="w-4 h-4" />
                                <span className="font-body text-[13px]">{r.label}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Difficulty Pills */}
                <div className="flex flex-col gap-2">
                  <label className="font-body text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    Difficulty
                  </label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className="flex-1 py-2 rounded-lg text-[13px] font-medium cursor-pointer"
                        style={{
                          background: difficulty === d ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                          color: difficulty === d ? 'white' : 'var(--text-secondary)',
                          border: difficulty === d ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          boxShadow: difficulty === d ? '0 0 16px rgba(79,142,247,0.2)' : 'none',
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interview Type Pills */}
                <div className="flex flex-col gap-2">
                  <label className="font-body text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    Interview Type
                  </label>
                  <div className="flex gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setInterviewType(t)}
                        className="flex-1 py-2 rounded-lg text-[13px] font-medium cursor-pointer"
                        style={{
                          background: interviewType === t ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                          color: interviewType === t ? 'white' : 'var(--text-secondary)',
                          border: interviewType === t ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          boxShadow: interviewType === t ? '0 0 16px rgba(79,142,247,0.2)' : 'none',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Start Button */}
                <button
                  onClick={handleStart}
                  disabled={!devicesReady}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-[16px] cursor-pointer"
                >
                  <span>Start Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
