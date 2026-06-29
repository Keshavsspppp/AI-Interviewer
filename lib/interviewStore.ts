import { create } from 'zustand';

export interface Message {
  role: 'interviewer' | 'candidate';
  text: string;
}

export interface Evaluation {
  score: number;
  breakdown: {
    technical_depth: number;
    communication: number;
    problem_solving: number;
    confidence: number;
    relevance: number;
  };
  strengths: string[];
  improvements: string[];
  watch_out_for: string[];
}

export type InterviewStatus = 'setup' | 'speaking' | 'listening' | 'thinking' | 'completed';
export type MicState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';

interface InterviewState {
  // Required fields
  role: string;
  difficulty: string;
  interviewType: string;
  messages: Message[];
  transcript: string[];
  isInterviewComplete: boolean;
  score: number;

  // Internal visual/state machine states
  status: InterviewStatus;
  micState: MicState;
  currentTranscript: string;
  error: string | null;
  evaluation: Evaluation | null;

  // Required actions
  setConfig: (role: string, difficulty: string, interviewType: string) => void;
  addMessage: (role: 'interviewer' | 'candidate', text: string) => void;
  addTranscriptEntry: (text: string) => void;
  setComplete: (complete: boolean) => void;
  setScore: (score: number) => void;
  reset: () => void;

  // API triggers and helpers
  startInterview: () => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  retryLastAnswer: () => Promise<void>;
  evaluateInterview: () => Promise<void>;
  setTranscriptBuffer: (text: string) => void;
  setStatus: (status: InterviewStatus) => void;
  setMicState: (micState: MicState) => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  // Defaults
  role: '',
  difficulty: '',
  interviewType: '',
  messages: [],
  transcript: [],
  isInterviewComplete: false,
  score: 0,

  status: 'setup',
  micState: 'IDLE',
  currentTranscript: '',
  error: null,
  evaluation: null,

  // Required actions
  setConfig: (role, difficulty, interviewType) => {
    set({ role, difficulty, interviewType, error: null });
  },

  addMessage: (role, text) => {
    set((state) => ({
      messages: [...state.messages, { role, text }]
    }));
  },

  addTranscriptEntry: (text) => {
    set((state) => ({
      transcript: [...state.transcript, text]
    }));
  },

  setComplete: (complete) => {
    set({ isInterviewComplete: complete });
  },

  setScore: (score) => {
    set({ score });
  },

  reset: () => {
    set({
      role: '',
      difficulty: '',
      interviewType: '',
      messages: [],
      transcript: [],
      isInterviewComplete: false,
      score: 0,
      status: 'setup',
      micState: 'IDLE',
      currentTranscript: '',
      error: null,
      evaluation: null,
    });
  },

  // Helpers
  setStatus: (status) => set({ status }),
  setMicState: (micState) => set({ micState }),
  setTranscriptBuffer: (text) => set({ currentTranscript: text }),

  startInterview: async () => {
    set({
      status: 'thinking',
      micState: 'PROCESSING',
      messages: [],
      transcript: [],
      isInterviewComplete: false,
      score: 0,
      evaluation: null,
      error: null
    });
    
    const { role, difficulty, interviewType } = get();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          difficulty,
          type: interviewType,
          messages: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start interview. Please check your Groq API key.');
      }

      const data = await response.json();
      set({
        messages: [{ role: 'interviewer', text: data.question }],
        status: 'speaking',
        micState: 'SPEAKING',
      });
    } catch (err: any) {
      set({
        error: err.message || 'Something went wrong',
        status: 'setup',
        micState: 'IDLE'
      });
    }
  },

  submitAnswer: async (answer) => {
    const { messages, role, difficulty, interviewType } = get();
    const cleanAnswer = answer.trim() || "(No verbal answer provided)";
    
    // Append messages and add answer to transcript array
    get().addMessage('candidate', cleanAnswer);
    get().addTranscriptEntry(cleanAnswer);

    set({
      currentTranscript: '',
      status: 'thinking',
      micState: 'PROCESSING',
      error: null, // Clear error on new try
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          difficulty,
          type: interviewType,
          messages: get().messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch next question from AI.');
      }

      const data = await response.json();
      set({
        messages: [...get().messages, { role: 'interviewer', text: data.question }],
        status: 'speaking',
        micState: 'SPEAKING',
      });
    } catch (err: any) {
      set({
        error: err.message || 'Error occurred while getting next question.',
        status: 'thinking',
        micState: 'IDLE', // Fallback to IDLE so user can retry
      });
    }
  },

  // Retries the last answer submission in case of mid-interview API failures
  retryLastAnswer: async () => {
    const { messages, role, difficulty, interviewType } = get();
    
    // The last message in history is the candidate's response
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'candidate') {
      set({ error: 'No response to retry.' });
      return;
    }

    set({
      status: 'thinking',
      micState: 'PROCESSING',
      error: null,
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          difficulty,
          type: interviewType,
          messages: messages, // Send with the last candidate message already present
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch next question from AI.');
      }

      const data = await response.json();
      set({
        messages: [...messages, { role: 'interviewer', text: data.question }],
        status: 'speaking',
        micState: 'SPEAKING',
      });
    } catch (err: any) {
      set({
        error: err.message || 'Error occurred during retry.',
        status: 'thinking',
        micState: 'IDLE',
      });
    }
  },

  evaluateInterview: async () => {
    set({ status: 'thinking', micState: 'PROCESSING' });
    const { messages, role, difficulty, interviewType } = get();

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          difficulty,
          type: interviewType,
          messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report.');
      }

      const data = await response.json();
      
      set({
        evaluation: data,
        score: data.score,
        isInterviewComplete: true,
        status: 'completed',
        micState: 'IDLE',
      });
    } catch (err: any) {
      set({
        error: err.message || 'Error evaluating interview.',
        status: 'completed',
        micState: 'IDLE'
      });
    }
  },
}));
