import React, { useState } from 'react';
import { Play, Pause, RefreshCw, CheckCircle2, AlertCircle, Loader2, Clock, ChevronDown, ChevronUp, FileAudio } from 'lucide-react';
import { NarrationBlock } from '../types';
import { formatDuration } from '../utils/segmentation';

interface QueueListProps {
  blocks: NarrationBlock[];
  activePlayingId: string | null;
  onPlayBlock: (block: NarrationBlock) => void;
  onPauseBlock: () => void;
  onRegenerateBlock: (block: NarrationBlock) => void;
  isGenerating: boolean;
  currentGeneratingId: string | null;
}

export const QueueList: React.FC<QueueListProps> = ({
  blocks,
  activePlayingId,
  onPlayBlock,
  onPauseBlock,
  onRegenerateBlock,
  isGenerating,
  currentGeneratingId,
}) => {
  const [expandedBlockIds, setExpandedBlockIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedBlockIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedBlockIds(new Set(blocks.map((b) => b.id)));
  };

  const collapseAll = () => {
    setExpandedBlockIds(new Set());
  };

  if (blocks.length === 0) {
    return (
      <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-8 text-center flex flex-col items-center justify-center text-zinc-500">
        <FileAudio className="w-10 h-10 mb-3 text-zinc-600" />
        <p className="text-sm font-medium text-zinc-400">Queue is empty</p>
        <p className="text-xs text-zinc-600 mt-1 max-w-sm">
          Paste your script into the editor on the left and click "Prepare Script" to generate your narration queue.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-xl overflow-hidden backdrop-blur-sm flex flex-col">
      {/* Queue Header */}
      <div className="px-5 py-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">
              Narration Queue ({blocks.length} Blocks)
            </h2>
            <p className="text-xs text-zinc-400">
              Sequential generation order and individual block previews
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={expandAll}
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Block List with Virtual Scroll / Max Height */}
      <div className="divide-y divide-zinc-800/80 overflow-y-auto max-h-[600px] p-2 space-y-1.5">
        {blocks.map((block) => {
          const isExpanded = expandedBlockIds.has(block.id);
          const isPlaying = activePlayingId === block.id;
          const isCurrentlyGenerating = currentGeneratingId === block.id || block.status === 'generating';

          return (
            <div
              key={block.id}
              className={`rounded-xl border transition-all ${
                isCurrentlyGenerating
                  ? 'bg-amber-500/5 border-amber-500/40 shadow-inner'
                  : block.status === 'completed'
                  ? 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                  : block.status === 'failed'
                  ? 'bg-rose-950/20 border-rose-800/40'
                  : 'bg-zinc-950/40 border-zinc-900 text-zinc-400'
              }`}
            >
              {/* Main row */}
              <div className="p-3.5 flex items-center justify-between gap-3">
                {/* Block Identifier & Status */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Status Indicator Icon */}
                  <div className="flex-shrink-0">
                    {block.status === 'completed' && (
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold font-mono">
                        ✓
                      </span>
                    )}
                    {isCurrentlyGenerating && (
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    )}
                    {block.status === 'pending' && (
                      <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-[10px] font-mono">
                        {String(block.index).padStart(2, '0')}
                      </span>
                    )}
                    {block.status === 'failed' && (
                      <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    )}
                    {block.status === 'retrying' && (
                      <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                    )}
                  </div>

                  {/* Block Title & Text Snippet */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-zinc-200">
                        BLOCK {String(block.index).padStart(3, '0')}
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        {block.charCount} chars
                      </span>
                      {block.duration && (
                        <span className="text-emerald-400 text-[11px] font-bold">
                          {formatDuration(block.duration)}
                        </span>
                      )}
                      {block.retryCount > 0 && (
                        <span className="text-amber-400 text-[10px] bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                          {block.retryCount} retry
                        </span>
                      )}
                    </div>
                    {/* Short Text Preview */}
                    <p className="text-xs text-zinc-400 truncate mt-0.5 font-sans">
                      {block.text}
                    </p>
                  </div>
                </div>

                {/* Actions: Audio Playback / Regenerate / Expand */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {block.status === 'completed' && block.audioBase64 && (
                    <button
                      type="button"
                      onClick={() => (isPlaying ? onPauseBlock() : onPlayBlock(block))}
                      className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                      }`}
                      title={isPlaying ? 'Pause' : 'Play block audio'}
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                  )}

                  {/* Regenerate Single Block Button */}
                  <button
                    type="button"
                    onClick={() => onRegenerateBlock(block)}
                    disabled={isGenerating}
                    className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 text-xs transition-colors disabled:opacity-40"
                    title="Regenerate this specific block"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Expand / Collapse Button */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(block.id)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                    title={isExpanded ? 'Collapse text' : 'Expand full text'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Text View */}
              {isExpanded && (
                <div className="px-4 pb-3.5 pt-1 text-xs border-t border-zinc-900 bg-zinc-950/60 font-sans">
                  <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1 flex items-center justify-between">
                    <span>Full Block Transcript</span>
                    <span>{block.charCount} characters</span>
                  </div>
                  <p className="text-zinc-200 leading-relaxed bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/80 select-text">
                    {block.text}
                  </p>
                  {block.error && (
                    <div className="mt-2 p-2 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px] font-mono flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span>{block.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
