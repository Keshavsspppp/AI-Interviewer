declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

let recognition: any = null;

export const startSpeechRecognition = (
  onResult: (text: string) => void,
  onError: (err: any) => void,
  onEnd: () => void
) => {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError(new Error('Speech recognition not supported in this browser. Please use Chrome/Safari/Edge.'));
    return null;
  }

  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {}
  }

  try {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + ' ';
      }
      onResult(fullTranscript.trim());
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' is triggered when user is quiet; we can ignore it
      if (event.error !== 'no-speech') {
        onError(event);
      }
    };

    recognition.onend = () => {
      onEnd();
    };

    recognition.start();
    return recognition;
  } catch (e) {
    onError(e);
    return null;
  }
};

export const stopSpeechRecognition = () => {
  if (recognition) {
    try {
      recognition.onend = null; // Remove end listener to prevent loops
      recognition.stop();
    } catch (e) {
      console.error('Error stopping speech recognition:', e);
    }
    recognition = null;
  }
};
