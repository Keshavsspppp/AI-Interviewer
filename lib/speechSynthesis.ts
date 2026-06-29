let utterance: SpeechSynthesisUtterance | null = null;
let isMutedGlobal = false;

export const setMuted = (muted: boolean) => {
  isMutedGlobal = muted;
  if (muted && typeof window !== 'undefined') {
    window.speechSynthesis.cancel();
  }
};

export const getMuted = () => isMutedGlobal;

export const speakText = (
  text: string,
  onStart: () => void,
  onEnd: () => void,
  onError: (err: any) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  window.speechSynthesis.cancel();

  if (isMutedGlobal) {
    onStart();
    // Simulate speaking time when muted so the user can read the text
    const wordCount = text.split(/\s+/).length;
    const duration = Math.max(1500, wordCount * 250); // ~240 WPM, min 1.5s
    const timer = setTimeout(() => {
      onEnd();
    }, duration);
    return () => clearTimeout(timer);
  }

  try {
    utterance = new SpeechSynthesisUtterance(text);
    
    // Select a pleasant English voice
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Apple'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }

    utterance.onstart = () => {
      onStart();
    };

    utterance.onend = () => {
      onEnd();
    };

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted') {
        onError(event);
      }
      onEnd();
    };

    window.speechSynthesis.speak(utterance);
    
    return () => {
      window.speechSynthesis.cancel();
    };
  } catch (e) {
    onError(e);
    onEnd();
    return () => {};
  }
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel();
  }
};
