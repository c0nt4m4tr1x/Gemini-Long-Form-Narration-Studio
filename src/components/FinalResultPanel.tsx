import React, { useRef, useState, useEffect } from 'react';
import { Download, Play, Pause, CheckCircle2, FileAudio, RotateCcw, Volume2, Sparkles } from 'lucide-react';
import { formatDuration } from '../utils/segmentation';
import { downloadBlob } from '../utils/audio';

interface FinalResultPanelProps {
  finalWavBlob: Blob | null;
  finalWavUrl: string | null;
  totalDuration: number;
  totalBlocks: number;
  totalChars: number;
  elapsedMs: number;
  defaultFilename: string;
  onRestartBatch: () => void;
}

export const FinalResultPanel: React.FC<FinalResultPanelProps> = ({
  finalWavBlob,
  finalWavUrl,
  totalDuration,
  totalBlocks,
  totalChars,
  elapsedMs,
  defaultFilename,
  onRestartBatch,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(totalDuration);
  const [filename, setFilename] = useState(defaultFilename || 'narracao_final.wav');

  useEffect(() => {
    setDuration(totalDuration);
  }, [totalDuration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleDownload = () => {
    if (!finalWavBlob) return;
    downloadBlob(finalWavBlob, filename);
  };

  return (
    <div className="bg-gradient-to-b from-emerald-950/20 via-zinc-900/80 to-zinc-900/80 rounded-2xl border-2 border-emerald-500/40 p-6 shadow-2xl backdrop-blur-md">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-emerald-800/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
                Generation Complete
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                100% READY
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              All narration blocks have been sequentially generated and concatenated into a continuous WAV file.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRestartBatch}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Batch</span>
          </button>
        </div>
      </div>

      {/* Production Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono text-xs">
        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">Total Blocks</span>
          <span className="text-zinc-100 font-bold text-base">{totalBlocks}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">Characters</span>
          <span className="text-zinc-100 font-bold text-base">{totalChars.toLocaleString()}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">Total Audio</span>
          <span className="text-emerald-400 font-bold text-base">{formatDuration(duration)}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">Generation Time</span>
          <span className="text-amber-400 font-bold text-base">
            {formatDuration(Math.floor(elapsedMs / 1000))}
          </span>
        </div>
      </div>

      {/* Master Audio Player */}
      {finalWavUrl && (
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 mb-6 space-y-3">
          <audio
            ref={audioRef}
            src={finalWavUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onLoadedMetadata={handleTimeUpdate}
            className="hidden"
          />

          <div className="flex items-center gap-4">
            <button
              id="play-final-narration-btn"
              type="button"
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer flex-shrink-0"
              title={isPlaying ? 'Pause narration' : 'Play final narration'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current text-zinc-950" />
              ) : (
                <Play className="w-5 h-5 fill-current text-zinc-950 ml-0.5" />
              )}
            </button>

            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span className="text-emerald-400 font-bold">{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
              <input
                id="audio-scrubber"
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filename and Download Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">File Name:</span>
          <input
            id="download-filename-input"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs flex-1 max-w-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <button
          id="download-final-narration-btn"
          type="button"
          onClick={handleDownload}
          disabled={!finalWavBlob}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-zinc-950" />
          <span>Download Final Narration (.WAV)</span>
        </button>
      </div>
    </div>
  );
};
