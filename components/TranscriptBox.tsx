'use client';

import React from 'react';
import { useInterviewStore } from '@/lib/interviewStore';
import { Mic, Check, HelpCircle } from 'lucide-react';

interface TranscriptBoxProps {
  onSubmitAnswer: () => void;
}

export default function TranscriptBox({ onSubmitAnswer }: TranscriptBoxProps) {
  const { messages, currentTranscript, status } = useInterviewStore();

  // Find the last interviewer message (question)
  const lastQuestion = [...messages]
    .reverse()
    .find((m) => m.role === 'interviewer')?.text || 'Initializing interview room...';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* AI Question Box */}
      <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-lg space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-violet-500" />
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Interviewer Question</span>
        </div>
        <p className="text-slate-100 font-medium text-lg leading-relaxed">{lastQuestion}</p>
      </div>

      {/* User Transcript Box */}
      <div className="bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${status === 'listening' ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-slate-850 text-slate-500'}`}>
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-300">
              {status === 'listening' ? 'Transcription (Speak now)' : 'Transcription Idle'}
            </span>
          </div>

          {status === 'listening' && (
            <button
              onClick={onSubmitAnswer}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Submit Answer</span>
            </button>
          )}
        </div>

        {/* Dynamic Transcription text */}
        <div className="min-h-[80px] bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-slate-355 text-sm leading-relaxed font-sans">
          {status === 'listening' ? (
            currentTranscript.trim() ? (
              <span className="text-slate-200 font-medium">{currentTranscript}</span>
            ) : (
              <span className="text-slate-500 italic">Listening... Start speaking to see your transcription here.</span>
            )
          ) : status === 'thinking' ? (
            <span className="text-indigo-400/80 animate-pulse flex items-center space-x-2 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping mr-1" />
              AI is formulating response...
            </span>
          ) : (
            <span className="text-slate-500 italic">Transcript is paused. AI Interviewer is preparing.</span>
          )}
        </div>

        {/* Tip text */}
        {status === 'listening' && (
          <p className="text-[11px] text-slate-500 text-center">
            Silence detection will auto-submit after 2.5 seconds of quiet. Or click &apos;Submit Answer&apos; above.
          </p>
        )}
      </div>
    </div>
  );
}
