export type BlockStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'retrying';

export interface NarrationBlock {
  id: string;
  index: number; // 1-based index (e.g. 1, 2, ...)
  text: string;
  charCount: number;
  status: BlockStatus;
  duration?: number; // duration in seconds
  audioBase64?: string;
  audioBlobUrl?: string;
  error?: string | null;
  retryCount: number;
  latencyMs?: number;
  updatedAt?: number;
}

export interface TtsConfig {
  model: string; // 'gemini-3.1-flash-tts-preview'
  voice: string; // 'Charon'
  locale: string; // 'pt-BR'
  temperature: number;
  maxBlockChars: number; // default 400
  scene: string;
  sampleContext: string;
  styleInstructions: string;
  voiceDirection: string;
  maxRetries: number;
  retryDelays: number[]; // [3000, 8000, 15000]
  outputFilename: string;
}

export type BatchRunState = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled' | 'error';

export interface BatchStats {
  totalBlocks: number;
  completedBlocks: number;
  failedBlocks: number;
  totalRetries: number;
  totalChars: number;
  totalGeneratedDuration: number;
  startTime?: number;
  elapsedMs: number;
  currentBlockIndex: number | null;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  description: string;
}

export interface LocaleOption {
  code: string;
  name: string;
  nativeName: string;
}
