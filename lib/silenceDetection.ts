import hark from 'hark';

interface SilenceDetectionOptions {
  threshold?: number; // Decibel threshold (e.g. -60)
  interval?: number;  // Interval in ms
}

export const startSilenceDetection = (
  stream: MediaStream,
  onSpeaking: () => void,
  onSilence: () => void,
  options?: SilenceDetectionOptions
) => {
  if (typeof window === 'undefined') return null;

  try {
    const speechEvents = hark(stream, {
      threshold: options?.threshold ?? -65, // Default is -65dB, lower is more sensitive
      interval: options?.interval ?? 100,   // Check every 100ms
      play: false,
    });

    speechEvents.on('speaking', () => {
      onSpeaking();
    });

    speechEvents.on('stopped_speaking', () => {
      onSilence();
    });

    return speechEvents;
  } catch (e) {
    console.error('Error starting silence detection with hark:', e);
    return null;
  }
};
