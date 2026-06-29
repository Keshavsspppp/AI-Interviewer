'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, AlertTriangle } from 'lucide-react';
import MicLevelBar from './MicLevelBar';

interface WebcamFeedProps {
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  showControls?: boolean;
  compact?: boolean;
}

export default function WebcamFeed({ onStreamReady, onError, showControls = true, compact = false }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [camReady, setCamReady] = useState(false);
  const [micReady, setMicReady] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function enableStream() {
      try {
        setError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: true,
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        setCamReady(mediaStream.getVideoTracks().length > 0);
        setMicReady(mediaStream.getAudioTracks().length > 0);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        if (onStreamReady) onStreamReady(mediaStream);
      } catch (err: any) {
        const errMsg = 'Could not access camera or microphone. Please check permissions in your browser settings.';
        setError(errMsg);
        if (onError) onError(errMsg);
      }
    }
    enableStream();
    return () => {
      if (activeStream) activeStream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleVideo = () => {
    if (stream) {
      const tracks = stream.getVideoTracks();
      if (tracks.length > 0) { tracks[0].enabled = !isVideoOn; setIsVideoOn(!isVideoOn); }
    }
  };
  const toggleAudio = () => {
    if (stream) {
      const tracks = stream.getAudioTracks();
      if (tracks.length > 0) { tracks[0].enabled = !isAudioOn; setIsAudioOn(!isAudioOn); }
    }
  };

  // Error / Permission denied state
  if (error) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center text-center gap-4" style={{ border: '1px solid var(--accent-danger)', minHeight: compact ? 200 : 280 }}>
        <AlertTriangle className="w-10 h-10" style={{ color: 'var(--accent-danger)' }} />
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary px-4 py-2 text-[13px]"
        >
          Grant Access & Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Video container */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 12,
          background: 'var(--bg-surface)',
          border: camReady ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
          aspectRatio: compact ? '16/10' : '4/3',
        }}
      >
        {isVideoOn && !error ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <CameraOff className="w-10 h-10" />
            <span className="font-body text-[12px] font-medium">Camera Off</span>
          </div>
        )}

        {/* "Camera Ready" badge */}
        {camReady && isVideoOn && (
          <div
            className="absolute bottom-3 left-3 pill"
            style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--accent-success)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--accent-success)' }} />
            <span className="text-[10px] font-semibold">Camera Ready</span>
          </div>
        )}

        {/* "You" name badge */}
        {!compact && (
          <div
            className="absolute bottom-3 right-3 pill"
            style={{ background: 'rgba(240,244,255,0.1)', color: 'var(--text-primary)', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-[10px] font-semibold">You</span>
          </div>
        )}
      </div>

      {/* Mic level bar */}
      {stream && <MicLevelBar stream={stream} />}

      {/* Device readiness + controls */}
      {showControls && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-[6px] h-[6px] rounded-full" style={{ background: camReady ? 'var(--accent-success)' : 'var(--accent-danger)' }} />
              Cam: {camReady ? '✓' : '✗'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-[6px] h-[6px] rounded-full" style={{ background: micReady ? 'var(--accent-success)' : 'var(--accent-danger)' }} />
              Mic: {micReady ? '✓' : '✗'}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleAudio}
              className="p-1.5 rounded-lg"
              style={{
                background: isAudioOn ? 'var(--bg-elevated)' : 'rgba(239,68,68,0.15)',
                border: isAudioOn ? '1px solid var(--border-subtle)' : '1px solid rgba(239,68,68,0.3)',
                color: isAudioOn ? 'var(--text-secondary)' : 'var(--accent-danger)',
              }}
            >
              {isAudioOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleVideo}
              className="p-1.5 rounded-lg"
              style={{
                background: isVideoOn ? 'var(--bg-elevated)' : 'rgba(239,68,68,0.15)',
                border: isVideoOn ? '1px solid var(--border-subtle)' : '1px solid rgba(239,68,68,0.3)',
                color: isVideoOn ? 'var(--text-secondary)' : 'var(--accent-danger)',
              }}
            >
              {isVideoOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
