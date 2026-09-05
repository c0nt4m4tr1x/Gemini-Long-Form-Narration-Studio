import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, RefreshCw, Activity, Layers, Hash, Sparkles } from 'lucide-react';
import { formatDuration } from '../utils/segmentation';
import { BatchRunState, BatchStats } from '../types';

interface ProgressDashboardProps {
  runState: BatchRunState;
  stats: BatchStats;
  currentBlockDuration?: number;
  activeBlockStatusText?: string;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  runState,
  stats,
  currentBlockDuration,
  activeBlockStatusText,
}) => {
  const {
    totalBlocks,
    completedBlocks,
    failedBlocks,
    totalRetries,
    totalChars,
    totalGeneratedDuration,
    elapsedMs,
    currentBlockIndex,
  } = stats;

  const progressPct = totalBlocks > 0 ? (completedBlocks / totalBlocks) * 100 : 0;
  const remainingBlocks = Math.max(0, totalBlocks - completedBlocks);

  // Calculate estimated remaining time based on average block generation latency
  let estimatedRemainingSecs = 0;
  if (completedBlocks > 0 && elapsedMs > 0) {
    const avgMsPerBlock = elapsedMs / completedBlocks;
    estimatedRemainingSecs = Math.round((avgMsPerBlock * remainingBlocks) / 1000);
  } else if (remainingBlocks > 0) {
    // Default estimated 4s per block
    estimatedRemainingSecs = remainingBlocks * 4;
  }

  const elapsedSecs = Math.floor(elapsedMs / 1000);

  return (
    <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
          <span className="text-xs font-mono font-semibold tracking-wider text-zinc-300 uppercase">
            Long-Form Batch Progress
          </span>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium border flex items-center gap-1.5 ${
              runState === 'running'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : runState === 'completed'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : runState === 'paused'
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                : runState === 'error'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {runState === 'running' && <Activity className="w-3.5 h-3.5 animate-spin" />}
            {runState === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>
              {runState === 'running'
                ? activeBlockStatusText || 'Generating...'
                : runState === 'completed'
                ? 'Generation Complete'
                : runState === 'paused'
                ? 'Batch Paused'
                : runState === 'error'
                ? 'Attention Required'
                : 'Ready to Run'}
            </span>
          </span>
        </div>
      </div>

      {/* Progress Bar and Main Ratio */}
      <div className="space-y-2 mb-5">
        <div className="flex justify-between items-baseline text-xs font-mono">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-100 font-sans tracking-tight">
              {progressPct.toFixed(1)}%
            </span>
            <span className="text-zinc-400">
              ({completedBlocks} of {totalBlocks} blocks complete)
            </span>
          </div>
          {currentBlockIndex !== null && runState === 'running' && (
            <div className="text-amber-400 font-bold">
              Current: BLOCK {String(currentBlockIndex).padStart(3, '0')}
            </div>
          )}
        </div>

        <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs font-mono">
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="text-zinc-500 block text-[10px] uppercase">Generated</span>
          <span className="text-emerald-400 font-bold text-sm">{completedBlocks}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="text-zinc-500 block text-[10px] uppercase">Remaining</span>
          <span className="text-zinc-300 font-bold text-sm">{remainingBlocks}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="text-zinc-500 block text-[10px] uppercase">Total Chars</span>
          <span className="text-zinc-100 font-bold text-sm">{totalChars.toLocaleString()}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="text-zinc-500 block text-[10px] uppercase">Total Audio</span>
          <span className="text-emerald-400 font-bold text-sm">
            {formatDuration(totalGeneratedDuration)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="text-zinc-500 block text-[10px] uppercase">Elapsed</span>
          <span className="text-zinc-300 font-bold text-sm">{formatDuration(elapsedSecs)}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="text-zinc-500 block text-[10px] uppercase">Est. Remaining</span>
          <span className="text-amber-300 font-bold text-sm">
            {runState === 'completed' ? '00:00' : formatDuration(estimatedRemainingSecs)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="text-zinc-500 block text-[10px] uppercase">Retries</span>
          <span className="text-amber-400 font-bold text-sm">{totalRetries}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="text-zinc-500 block text-[10px] uppercase">Failed</span>
          <span className={`font-bold text-sm ${failedBlocks > 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
            {failedBlocks}
          </span>
        </div>
      </div>
    </div>
  );
};
