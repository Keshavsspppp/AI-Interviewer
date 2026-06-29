'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/lib/interviewStore';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { speakText, stopSpeaking, setMuted } from '@/lib/speechSynthesis';
import { startSpeechRecognition, stopSpeechRecognition } from '@/lib/speechRecognition';
import { startSilenceDetection } from '@/lib/silenceDetection';
import { Mic, MicOff, Video, VideoOff, LogOut, AlertTriangle, Check, RefreshCw, Clock } from 'lucide-react';

const WebcamFeed = dynamic(() => import('@/components/WebcamFeed'), { ssr: false });
const WaveformVisualizer = dynamic(() => import('@/components/WaveformVisualizer'), { ssr: false });

export default function InterviewPage() {
  const router = useRouter();
  const {
    role,
    difficulty,
    interviewType,
    status,
    micState,
    messages,
    transcript,
    currentTranscript,
    submitAnswer,
    retryLastAnswer,
    setTranscriptBuffer,
    setStatus,
    setMicState,
    evaluateInterview,
    error,
  } = useInterviewStore();

  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isChrome, setIsChrome] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const isSubmittingRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Elapsed timer — counts up
  useEffect(() => {
    const interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect Chrome
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isChromium = (window as any).chrome;
      const vendorName = window.navigator.vendor;
      const isOpera = typeof (window as any).opr !== 'undefined';
      const isIEedge = window.navigator.userAgent.indexOf('Edg') > -1;
      const isGoogleChrome =
        isChromium !== null &&
        typeof isChromium !== 'undefined' &&
        vendorName === 'Google Inc.' &&
        isOpera === false &&
        isIEedge === false;
      setIsChrome(isGoogleChrome);
    }
  }, []);

  // Redirect if settings missing
  useEffect(() => {
    if (!role) router.push('/');
  }, [role, router]);

  // Auto-start the interview
  useEffect(() => {
    if (role && status === 'setup') {
      useInterviewStore.getState().startInterview();
    }
  }, [role]);

  // Scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Per-Question 2-Minute Timer
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    if (status === 'listening' && micState === 'LISTENING') {
      setTimeLeft(120);
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerInterval) clearInterval(timerInterval);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeLeft(120);
    }
    return () => { if (timerInterval) clearInterval(timerInterval); };
  }, [status, micState]);

  // Session persistence before navigating
  const evaluateAndNavigate = async () => {
    const currentMessages = useInterviewStore.getState().messages;
    const currentTranscript = useInterviewStore.getState().transcript;
    sessionStorage.setItem('messages', JSON.stringify(currentMessages));
    sessionStorage.setItem('transcript', JSON.stringify(currentTranscript));
    sessionStorage.setItem('role', role);
    sessionStorage.setItem('difficulty', difficulty);
    sessionStorage.setItem('interviewType', interviewType);
    await evaluateInterview();
    const evalData = useInterviewStore.getState().evaluation;
    if (evalData) {
      sessionStorage.setItem('evaluation', JSON.stringify(evalData));
    }
    router.push('/results');
  };

  // TTS and Speech Recognition Loop
  useEffect(() => {
    if (!role || permissionError) return;
    let cancelTts: (() => void) | null = null;
    let harkInstance: any = null;

    if (status === 'speaking') {
      isSubmittingRef.current = false;
      const lastInterviewerMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'interviewer');

      if (lastInterviewerMessage) {
        cancelTts = speakText(
          lastInterviewerMessage.text,
          () => { setIsSpeaking(true); setMicState('SPEAKING'); },
          async () => {
            setIsSpeaking(false);
            setMicState('IDLE');
            if (lastInterviewerMessage.text.includes("That concludes our interview")) {
              await evaluateAndNavigate();
            } else {
              setMicState('LISTENING');
              setStatus('listening');
            }
          },
          async (err) => {
            console.error('Speech synthesis error:', err);
            setIsSpeaking(false);
            setMicState('IDLE');
            if (lastInterviewerMessage.text.includes("That concludes our interview")) {
              await evaluateAndNavigate();
            } else {
              setMicState('LISTENING');
              setStatus('listening');
            }
          }
        );
      } else {
        setMicState('LISTENING');
        setStatus('listening');
      }
    } else if (status === 'listening' && micState === 'LISTENING') {
      startSpeechRecognition(
        (text) => { setTranscriptBuffer(text); },
        (err) => { console.error('Speech recognition error:', err); },
        () => {
          if (
            useInterviewStore.getState().status === 'listening' &&
            useInterviewStore.getState().micState === 'LISTENING'
          ) {
            startSpeechRec();
          }
        }
      );

      if (webcamStream && status === 'listening' && micState === 'LISTENING') {
        harkInstance = startSilenceDetection(
          webcamStream,
          () => {},
          () => { handleAutoSubmit(); }
        );
      }
    } else if (status === 'thinking' || micState === 'PROCESSING') {
      stopSpeaking();
      stopSpeechRecognition();
      if (harkInstance) harkInstance.stop();
    }

    function startSpeechRec() {
      const state = useInterviewStore.getState();
      if (state.status === 'listening' && state.micState === 'LISTENING') {
        startSpeechRecognition(
          (text) => setTranscriptBuffer(text),
          (err) => console.error(err),
          () => {
            const nextState = useInterviewStore.getState();
            if (nextState.status === 'listening' && nextState.micState === 'LISTENING') {
              startSpeechRec();
            }
          }
        );
      }
    }

    return () => {
      if (cancelTts) cancelTts();
      stopSpeechRecognition();
      if (harkInstance) harkInstance.stop();
    };
  }, [status, micState, webcamStream, role, permissionError]);

  const handleAutoSubmit = () => {
    if (isSubmittingRef.current) return;
    const currentText = useInterviewStore.getState().currentTranscript;
    triggerSubmit(currentText);
  };

  const handleManualSubmit = () => {
    triggerSubmit(currentTranscript);
  };

  const triggerSubmit = (text: string) => {
    isSubmittingRef.current = true;
    submitAnswer(text);
  };

  const toggleMute = () => {
    const nextMute = !isAudioMuted;
    setIsAudioMuted(nextMute);
    setMuted(nextMute);
  };

  const handleEndEarly = async () => {
    setShowEndModal(false);
    await evaluateAndNavigate();
  };

  const toggleCamera = () => {
    if (webcamStream) {
      const tracks = webcamStream.getVideoTracks();
      if (tracks.length > 0) { tracks[0].enabled = !isCameraOn; setIsCameraOn(!isCameraOn); }
    }
  };

  const toggleMic = () => {
    if (webcamStream) {
      const tracks = webcamStream.getAudioTracks();
      if (tracks.length > 0) { tracks[0].enabled = isMicMuted; setIsMicMuted(!isMicMuted); }
    }
  };

  // Format elapsed time
  const formatTime = (s: number) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  // Count questions
  const questionCount = messages.filter(m => m.role === 'interviewer').length;

  // Permission error screen
  if (permissionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--bg-base)' }}>
        <div className="card p-8 max-w-md w-full flex flex-col items-center gap-6" style={{ border: '1px solid var(--accent-danger)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertTriangle className="w-8 h-8" style={{ color: 'var(--accent-danger)' }} />
          </div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Microphone & Camera Blocked</h2>
          <div className="text-left text-[13px] space-y-3" style={{ color: 'var(--text-secondary)' }}>
            <p>InterviewAI requires camera and microphone permissions to conduct your voice interview.</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>To grant permission:</p>
            <ol className="list-decimal list-inside space-y-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              <li>Click the <strong style={{ color: 'var(--text-primary)' }}>lock icon</strong> next to the URL bar.</li>
              <li>Toggle <strong style={{ color: 'var(--text-primary)' }}>Camera</strong> and <strong style={{ color: 'var(--text-primary)' }}>Microphone</strong> to Allow.</li>
              <li>Refresh this page.</li>
            </ol>
          </div>
          <button onClick={() => window.location.reload()} className="btn-primary w-full py-3 text-[14px]">
            I Granted Access, Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-10 h-10 rounded-full" style={{ border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)', animation: 'spin-slow 0.8s linear infinite' }} />
      </div>
    );
  }

  const isMicOpen = status === 'listening' && micState === 'LISTENING';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* ─── Top Bar ─── */}
      <header className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
              <span className="font-display text-[12px] font-bold text-white">A</span>
            </div>
            <span className="font-display text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>InterviewAI</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            <span>{role.split(' ').map(w => w[0]).join('')}</span>
            <span>·</span>
            <span>{difficulty}</span>
            <span>·</span>
            <span>{interviewType}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="font-mono text-[13px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
          <Clock className="w-3.5 h-3.5 inline-block mr-1.5" style={{ verticalAlign: 'text-top' }} />
          {formatTime(elapsedTime)}
        </div>
      </header>

      {/* Chrome warning */}
      {!isChrome && (
        <div className="flex items-center gap-2.5 px-6 py-2.5 text-[12px]" style={{ background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.15)', color: 'var(--accent-warning)' }}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Please use Google Chrome for the best experience with Web Speech recognition.</span>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0" style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        {/* Left: User Webcam Panel */}
        <div className="lg:w-[45%] p-6 flex flex-col gap-4">
          <WebcamFeed
            onStreamReady={setWebcamStream}
            onError={setPermissionError}
            showControls={false}
            compact
          />

          {/* Mic status indicator */}
          <div className="flex items-center gap-2">
            {isMicOpen ? (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-[8px] w-[8px]">
                  <span className="absolute inset-0 rounded-full" style={{ background: 'var(--accent-success)', animation: 'mic-pulse 1.5s infinite' }} />
                  <span className="relative rounded-full h-full w-full" style={{ background: 'var(--accent-success)' }} />
                </span>
                <span className="text-[12px] font-medium" style={{ color: 'var(--accent-success)' }}>Listening...</span>
              </div>
            ) : status === 'thinking' || micState === 'PROCESSING' ? (
              <div className="flex items-center gap-1.5">
                <span className="w-[8px] h-[8px] rounded-full" style={{ border: '2px solid transparent', borderTopColor: 'var(--accent-warning)', animation: 'spin-slow 0.8s linear infinite' }} />
                <span className="text-[12px] font-medium" style={{ color: 'var(--accent-warning)' }}>Processing...</span>
              </div>
            ) : null}
          </div>

          {/* Per-question timer */}
          {isMicOpen && (
            <div className="flex items-center gap-1.5 font-mono text-[12px]" style={{ color: timeLeft <= 30 ? 'var(--accent-danger)' : 'var(--text-tertiary)' }}>
              <Clock className="w-3 h-3" />
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} remaining</span>
            </div>
          )}
        </div>

        {/* Right: AI Interviewer Panel */}
        <div className="lg:w-[55%] p-6 flex flex-col gap-4">
          <div className="card flex-1 flex flex-col overflow-hidden" style={{ minHeight: 480 }}>
            {/* AI Avatar + Waveform */}
            <div className="p-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <WaveformVisualizer status={status} />
            </div>

            {/* Transcript — mono font, flat text */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin" style={{ maxHeight: 180 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Transcript</span>
                <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Q {questionCount} of ~10</span>
              </div>

              <div className="flex flex-col gap-3">
                {messages.filter(m => m.text).map((m, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="font-mono text-[13px] leading-[1.6]"
                  >
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
                  </motion.div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>

            {/* Error toast */}
            {error && micState === 'IDLE' && (
              <div className="mx-4 mb-3 p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="flex items-center gap-2 text-[12px] font-medium" style={{ color: 'var(--accent-danger)' }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => retryLastAnswer()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
                  style={{ background: 'var(--accent-primary)', color: 'white' }}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Live subtitles bar */}
            <div className="p-4" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  <Mic className="w-3 h-3" style={{ color: isMicOpen ? 'var(--accent-success)' : 'var(--text-tertiary)' }} />
                  <span>Candidate Response</span>
                </div>
                {isMicOpen && (
                  <button
                    onClick={handleManualSubmit}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                  >
                    <Check className="w-3 h-3" />
                    <span>Submit</span>
                  </button>
                )}
              </div>

              <div className="font-mono text-[12px] min-h-[40px] flex items-center">
                {status === 'thinking' || micState === 'PROCESSING' ? (
                  <div className="flex items-center gap-1.5" style={{ color: 'var(--accent-warning)' }}>
                    <span className="w-[8px] h-[8px] rounded-full" style={{ border: '2px solid transparent', borderTopColor: 'var(--accent-warning)', animation: 'spin-slow 0.8s linear infinite' }} />
                    <span className="font-medium">Thinking...</span>
                  </div>
                ) : isMicOpen ? (
                  currentTranscript.trim() ? (
                    <span style={{ color: 'var(--text-primary)' }}>{currentTranscript}</span>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)' }}>Listening... Speak now.</span>
                  )
                ) : (
                  <span style={{ color: 'var(--text-tertiary)' }}>Mic closed while interviewer speaks.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Control Bar ─── */}
      <footer className="flex items-center justify-center gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {/* Mute Mic */}
        <button
          onClick={toggleMic}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer text-[13px] font-medium"
          style={{
            background: isMicMuted ? 'rgba(239,68,68,0.1)' : 'var(--bg-elevated)',
            border: isMicMuted ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-subtle)',
            color: isMicMuted ? 'var(--accent-danger)' : 'var(--text-secondary)',
          }}
        >
          {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span>{isMicMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer text-[13px] font-medium"
          style={{
            background: !isCameraOn ? 'rgba(239,68,68,0.1)' : 'var(--bg-elevated)',
            border: !isCameraOn ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-subtle)',
            color: !isCameraOn ? 'var(--accent-danger)' : 'var(--text-secondary)',
          }}
        >
          {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          <span>{isCameraOn ? 'Camera Off' : 'Camera On'}</span>
        </button>

        {/* End Interview */}
        <button
          onClick={() => setShowEndModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer text-[13px] font-medium"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--accent-danger)',
          }}
        >
          <LogOut className="w-4 h-4" />
          <span>End Interview</span>
        </button>
      </footer>

      {/* ─── End Interview Confirmation Modal ─── */}
      <AnimatePresence>
        {showEndModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="card p-6 max-w-sm w-full mx-4 flex flex-col gap-4"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <LogOut className="w-5 h-5" style={{ color: 'var(--accent-danger)' }} />
                </div>
                <div>
                  <h3 className="font-display text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>End Interview?</h3>
                  <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>You will be evaluated on answered questions.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEndModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndEarly}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer"
                  style={{ background: 'var(--accent-danger)', color: 'white' }}
                >
                  End & Evaluate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
