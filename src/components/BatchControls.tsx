import React from 'react';
import { Play, Pause, Square, Sparkles, RefreshCw, Volume2, AlertCircle } from 'lucide-react';
import { BatchRunState } from '../types';

interface BatchControlsProps {
  runState: BatchRunState;
  hasBlocks: boolean;
  onPrepare: () => void;
  onGenerateTest: () => void;
  onStartBatch: () => void;
  onPauseBatch: () => void;
  onResumeBatch: () => void;
  onCancelBatch: () => void;
  onRetryFailed?: () => void;
  hasFailedBlocks: boolean;
  testBlockCompleted: boolean;
}

export const BatchControls: React.FC<BatchControlsProps> = ({
  runState,
  hasBlocks,
  onPrepare,
  onGenerateTest,
  onStartBatch,
  onPauseBatch,
  onResumeBatch,
  onCancelBatch,
  onRetryFailed,
  hasFailedBlocks,
  testBlockCompleted,
}) => {
  const isRunning = runState === 'running';
  const isPaused = runState === 'paused';

  return (
    <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
      {/* Left side actions */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Test Block Button */}
        <button
          id="generate-test-block-btn"
          type="button"
          onClick={onGenerateTest}
          disabled={!hasBlocks || isRunning}
          className="px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Generate audio only for Block 001 to preview voice and delivery before starting full batch"
        >
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span>Generate Test Block</span>
        </button>

        {testBlockCompleted && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Test audio ready
          </span>
        )}
      </div>

      {/* Main Execution Controls */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Retry Failed Button if any block is in error */}
        {hasFailedBlocks && !isRunning && onRetryFailed && (
          <button
            id="retry-failed-batch-btn"
            type="button"
            onClick={onRetryFailed}
            className="px-4 py-2.5 rounded-xl border border-rose-800/50 bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer"
          >
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Retry Failed Block</span>
          </button>
        )}

        {/* Start / Resume / Pause Main CTA */}
        {!isRunning && !isPaused && (
          <button
            id="start-full-batch-btn"
            type="button"
            onClick={onStartBatch}
            disabled={!hasBlocks}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Play className="w-4 h-4 fill-zinc-950 text-zinc-950" />
            <span>Start Full Batch</span>
          </button>
        )}

        {isRunning && (
          <button
            id="pause-batch-btn"
            type="button"
            onClick={onPauseBatch}
            className="px-5 py-2.5 rounded-xl border border-amber-600/50 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer"
          >
            <Pause className="w-4 h-4 text-amber-300" />
            <span>Pause Batch</span>
          </button>
        )}

        {isPaused && (
          <button
            id="resume-batch-btn"
            type="button"
            onClick={onResumeBatch}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-zinc-950 text-zinc-950" />
            <span>Resume Batch</span>
          </button>
        )}

        {/* Cancel Batch Button */}
        {(isRunning || isPaused) && (
          <button
            id="cancel-batch-btn"
            type="button"
            onClick={onCancelBatch}
            className="px-4 py-2.5 rounded-xl border border-rose-900/40 bg-zinc-900 hover:bg-rose-950/40 text-rose-300 font-medium text-xs tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
            <span>Cancel</span>
          </button>
        )}
      </div>
    </div>
  );
};
