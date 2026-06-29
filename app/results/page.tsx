'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/lib/interviewStore';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, ChevronDown, ChevronUp } from 'lucide-react';

const ScoreCard = dynamic(() => import('@/components/ScoreCard'), { ssr: false });
const BreakdownChart = dynamic(() => import('@/components/BreakdownChart'), { ssr: false });
const FeedbackSection = dynamic(() => import('@/components/FeedbackSection'), { ssr: false });

export default function ResultsPage() {
  const router = useRouter();
  const {
    role,
    difficulty,
    interviewType,
    evaluation,
    messages,
    reset,
    status
  } = useInterviewStore();

  const [showTranscript, setShowTranscript] = useState(false);

  // Load from sessionStorage backup if store was reset/refreshed
  useEffect(() => {
    if (!evaluation) {
      const savedEvaluation = sessionStorage.getItem('evaluation');
      const savedMessages = sessionStorage.getItem('messages');
      const savedTranscript = sessionStorage.getItem('transcript');
      const savedRole = sessionStorage.getItem('role');
      const savedDifficulty = sessionStorage.getItem('difficulty');
      const savedType = sessionStorage.getItem('interviewType');

      if (savedEvaluation && savedMessages) {
        const parsedEval = JSON.parse(savedEvaluation);
        useInterviewStore.setState({
          evaluation: parsedEval,
          messages: JSON.parse(savedMessages),
          transcript: savedTranscript ? JSON.parse(savedTranscript) : [],
          role: savedRole || 'Candidate',
          difficulty: savedDifficulty || 'Medium',
          interviewType: savedType || 'Mixed',
          isInterviewComplete: true,
          score: parsedEval.score || 0,
          status: 'completed',
        });
      } else if (status !== 'thinking') {
        router.push('/');
      }
    }
  }, [evaluation, status, router]);

  const handleRestart = () => {
    reset();
    sessionStorage.clear();
    router.push('/');
  };

  if (status === 'thinking' || !evaluation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: 'var(--bg-base)' }}>
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full" style={{ border: '4px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)', animation: 'spin-slow 0.8s linear infinite' }} />
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-[10px] font-bold" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--accent-primary)' }}>
            AI
          </div>
        </div>
        <p className="text-[13px] font-medium" style={{ color: 'var(--text-tertiary)', animation: 'mic-pulse 2s infinite' }}>
          Analyzing your interview...
        </p>
      </div>
    );
  }

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      {/* ─── On-Screen Dashboard (Hidden on Print) ─── */}
      <div className="min-h-screen flex flex-col print-hidden" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        {/* Navbar */}
        <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
              <span className="font-display text-[14px] font-bold text-white">A</span>
            </div>
            <span className="font-display text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>InterviewAI</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Interview</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer"
              style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          </div>
        </nav>

        {/* Content */}
        <motion.div
          className="flex-1 w-full px-6 py-8"
          style={{ maxWidth: 1280, margin: '0 auto' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Eyebrow */}
          <p className="font-mono text-[11px] font-medium tracking-wider uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Interview Complete · {role.split(' ').map(w => w[0]).join('')} · {dateStr}
          </p>

          {/* Score + Radar row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Score Ring */}
            <div className="lg:col-span-4">
              <ScoreCard score={evaluation.score} />
            </div>

            {/* Radar Chart */}
            <div className="lg:col-span-8">
              <BreakdownChart breakdown={evaluation.breakdown} />
            </div>
          </div>

          {/* Feedback Cards */}
          <div className="mt-8">
            <FeedbackSection
              strengths={evaluation.strengths}
              improvements={evaluation.improvements}
              watch_out_for={evaluation.watch_out_for}
            />
          </div>

          {/* Transcript Toggle */}
          <div className="mt-8">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showTranscript ? 'Hide' : 'View'} Full Transcript</span>
            </button>

            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="card mt-4 p-6">
                    <div className="flex flex-col gap-3">
                      {messages.filter(m => m.text).map((m, idx) => (
                        <div key={idx} className="font-mono text-[13px] leading-[1.6]">
                          {m.role === 'interviewer' ? (
                            <p>
                              <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>Alex — </span>
                              <span style={{ color: 'var(--text-secondary)' }}>{m.text}</span>
                            </p>
                          ) : (
                            <p>
                              <span className="font-semibold" style={{ color: 'var(--text-tertiary)' }}>You — </span>
                              <span style={{ color: 'var(--text-primary)' }}>{m.text}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="px-6 py-4 text-center text-[11px]" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
          © {new Date().getFullYear()} InterviewAI. Review your metrics to prepare for live interviews.
        </footer>
      </div>

      {/* ─── Print-Only Summary ─── */}
      <div className="hidden print-block text-black bg-white p-8 w-full max-w-4xl mx-auto space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
        <div style={{ borderBottom: '2px solid #1a1a1a', paddingBottom: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)' }}>InterviewAI Assessment Report</h1>
          <p style={{ color: '#666', fontSize: 13 }}>Official Mock Interview Feedback Scorecard</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#f9fafb', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}>
          <div>
            <p style={{ margin: '4px 0' }}><strong>Target Role:</strong> {role}</p>
            <p style={{ margin: '4px 0' }}><strong>Difficulty:</strong> {difficulty}</p>
            <p style={{ margin: '4px 0' }}><strong>Focus:</strong> {interviewType}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '4px 0' }}><strong>Date:</strong> {dateStr}</p>
            <p style={{ margin: '4px 0', fontSize: 18 }}><strong>Score:</strong> <span style={{ fontSize: 28, fontWeight: 800, color: '#4F8EF7' }}>{evaluation.score}</span> / 100</p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: 8, border: '1px solid #d1d5db', textAlign: 'left' }}>Dimension</th>
              <th style={{ padding: 8, border: '1px solid #d1d5db', textAlign: 'left' }}>Score</th>
              <th style={{ padding: 8, border: '1px solid #d1d5db', textAlign: 'left' }}>Max</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Technical Depth', evaluation.breakdown.technical_depth],
              ['Communication', evaluation.breakdown.communication],
              ['Problem Solving', evaluation.breakdown.problem_solving],
              ['Confidence', evaluation.breakdown.confidence],
              ['Relevance', evaluation.breakdown.relevance],
            ].map(([name, val]) => (
              <tr key={name as string}>
                <td style={{ padding: 8, border: '1px solid #d1d5db' }}>{name}</td>
                <td style={{ padding: 8, border: '1px solid #d1d5db', fontWeight: 700 }}>{val as number}</td>
                <td style={{ padding: 8, border: '1px solid #d1d5db' }}>/ 20</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#16a34a', borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>Strengths</h3>
          <ul style={{ fontSize: 13, color: '#374151', marginTop: 8, paddingLeft: 20 }}>
            {evaluation.strengths.map((s: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
          </ul>
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#4F8EF7', borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>Areas to Improve</h3>
          <ul style={{ fontSize: 13, color: '#374151', marginTop: 8, paddingLeft: 20 }}>
            {evaluation.improvements.map((s: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
          </ul>
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d97706', borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>Watch Out For</h3>
          <ul style={{ fontSize: 13, color: '#374151', marginTop: 8, paddingLeft: 20 }}>
            {evaluation.watch_out_for.map((s: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
          </ul>
        </div>

        <div style={{ borderTop: '1px solid #d1d5db', paddingTop: 12, textAlign: 'center', fontSize: 10, color: '#9ca3af' }}>
          Generated by InterviewAI mock assessment software.
        </div>
      </div>
    </>
  );
}
