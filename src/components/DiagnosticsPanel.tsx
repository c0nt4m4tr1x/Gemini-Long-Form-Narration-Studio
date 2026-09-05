import React from 'react';
import { Terminal, X, CheckCircle2, AlertCircle, RefreshCw, Cpu, Server, HardDrive } from 'lucide-react';
import { GEMINI_TTS_MODEL } from '../constants';
import { BatchRunState, BatchStats, TtsConfig } from '../types';

interface DiagnosticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  serverStatus: 'ready' | 'checking' | 'error';
  statusMessage?: string;
  config: TtsConfig;
  runState: BatchRunState;
  stats: BatchStats;
  lastLatencyMs?: number;
  dbReady: boolean;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  isOpen,
  onClose,
  serverStatus,
  statusMessage,
  config,
  runState,
  stats,
  lastLatencyMs,
  dbReady,
}) => {
  if (!isOpen) return null;

  return (
    <div className="bg-zinc-950/95 border border-zinc-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md mb-6 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs">
            System Diagnostics & Runtime Telemetry
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-850 text-zinc-400 border border-zinc-700">
            NON-SENSITIVE METRICS
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Close Diagnostics"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Model & Runtime */}
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5">
          <div className="text-zinc-500 uppercase text-[10px] flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-amber-400" />
            Model & Platform
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Target Model:</span>
            <span className="text-amber-300 font-bold">{GEMINI_TTS_MODEL}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Runtime Status:</span>
            <span
              className={`font-bold ${
                serverStatus === 'ready'
                  ? 'text-emerald-400'
                  : serverStatus === 'checking'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {serverStatus.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Server Status:</span>
            <span className="text-zinc-300 truncate max-w-[160px]">{statusMessage || 'Connected'}</span>
          </div>
        </div>

        {/* Audio Pipeline */}
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5">
          <div className="text-zinc-500 uppercase text-[10px] flex items-center gap-1.5">
            <Server className="w-3 h-3 text-blue-400" />
            Audio Synthesis Pipeline
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Active Voice:</span>
            <span className="text-zinc-200 font-bold">{config.voice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Target Locale:</span>
            <span className="text-zinc-200">{config.locale}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Audio Container:</span>
            <span className="text-emerald-400 font-bold">WAV / PCM 24,000 Hz Mono</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Last Latency:</span>
            <span className="text-amber-400">{lastLatencyMs ? `${lastLatencyMs} ms` : 'N/A'}</span>
          </div>
        </div>

        {/* Queue & Storage */}
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5">
          <div className="text-zinc-500 uppercase text-[10px] flex items-center gap-1.5">
            <HardDrive className="w-3 h-3 text-purple-400" />
            Batch Queue & Persistence
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Queue State:</span>
            <span className="text-zinc-200 font-bold">{runState.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Total Blocks:</span>
            <span className="text-zinc-200">{stats.totalBlocks}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Retries Logged:</span>
            <span className="text-amber-300">{stats.totalRetries}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">IndexedDB Cache:</span>
            <span className={dbReady ? 'text-emerald-400' : 'text-zinc-500'}>
              {dbReady ? 'ACTIVE / PERSISTENT' : 'INITIALIZING'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
