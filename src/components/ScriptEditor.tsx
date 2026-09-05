import React, { useRef, useState } from 'react';
import { Upload, Trash2, FileText, Sparkles, Sliders, AlertTriangle } from 'lucide-react';
import { estimateNarrationDuration, formatDuration } from '../utils/segmentation';
import { SAMPLE_PORTUGUESE_SCRIPT } from '../constants';

interface ScriptEditorProps {
  script: string;
  onChangeScript: (newScript: string) => void;
  maxBlockChars: number;
  onChangeMaxChars: (val: number) => void;
  onPrepareScript: () => void;
  isPrepared: boolean;
  totalBlocks: number;
  isGenerating: boolean;
  actualDuration?: number;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  onChangeScript,
  maxBlockChars,
  onChangeMaxChars,
  onPrepareScript,
  isPrepared,
  totalBlocks,
  isGenerating,
  actualDuration,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);

  const charCount = script.length;
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const estimatedBlocks = script.trim() ? Math.ceil(charCount / (maxBlockChars * 0.85)) : 0;
  const estimatedSecs = estimateNarrationDuration(charCount);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readTextFile(file);
  };

  const readTextFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onChangeScript(content);
        setImportedFileName(file.name);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readTextFile(file);
    }
  };

  const handleLoadSample = () => {
    onChangeScript(SAMPLE_PORTUGUESE_SCRIPT);
    setImportedFileName('amostra_portugues_cosmos.txt');
  };

  const handleClear = () => {
    if (script && !window.confirm('Are you sure you want to clear the current script?')) {
      return;
    }
    onChangeScript('');
    setImportedFileName(null);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Editor Header Bar */}
      <div className="px-5 py-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">
              Script Editor
            </h2>
            <p className="text-xs text-zinc-400">
              Paste or import your long narration script below
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,text/plain"
            className="hidden"
            id="txt-file-input"
          />

          <button
            id="import-txt-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 hover:text-amber-300 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Import a .txt file from your computer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import TXT</span>
          </button>

          <button
            id="load-sample-btn"
            type="button"
            onClick={handleLoadSample}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Load Portuguese astronomical documentary sample (12 sentences)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Load Sample (pt-BR)</span>
            <span className="sm:hidden">Sample</span>
          </button>

          {script && (
            <button
              id="clear-script-btn"
              type="button"
              onClick={handleClear}
              disabled={isGenerating}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:border-rose-900/40 text-xs transition-colors disabled:opacity-50"
              title="Clear script"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div
        className={`relative flex-1 p-4 transition-colors ${
          isDragging ? 'bg-amber-500/5 border-2 border-dashed border-amber-500/40' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          id="script-textarea"
          value={script}
          onChange={(e) => onChangeScript(e.target.value)}
          disabled={isGenerating}
          placeholder="Cole seu texto longo aqui ou clique em 'Import TXT'. O sistema dividirá automaticamente o roteiro em blocos sem nunca cortar frases ao meio..."
          className="w-full h-72 sm:h-80 md:h-96 lg:h-[420px] bg-transparent text-zinc-200 placeholder-zinc-500 text-sm leading-relaxed resize-none focus:outline-none font-sans"
        />

        {importedFileName && (
          <div className="absolute bottom-3 left-4 px-2.5 py-1 rounded bg-zinc-800/90 border border-zinc-700/60 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-amber-400" />
            <span>File: {importedFileName}</span>
          </div>
        )}
      </div>

      {/* Segmentation Control Bar & Stats */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex flex-col gap-3">
        {/* Top metrics bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase">Characters</span>
            <span className="text-zinc-100 font-bold text-sm">{charCount.toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase">Words</span>
            <span className="text-zinc-100 font-bold text-sm">{wordCount.toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase">
              {isPrepared ? 'Active Blocks' : 'Est. Blocks'}
            </span>
            <span className="text-amber-400 font-bold text-sm">
              {isPrepared ? totalBlocks : estimatedBlocks}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase">
              {actualDuration ? 'Generated Duration' : 'Est. Duration'}
            </span>
            <span className="text-emerald-400 font-bold text-sm">
              {actualDuration ? formatDuration(actualDuration) : `~${formatDuration(estimatedSecs)}`}
            </span>
          </div>
        </div>

        {/* Max Characters Slider and Prepare Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono whitespace-nowrap">
              <Sliders className="w-3.5 h-3.5 text-zinc-500" />
              <span>Max block size:</span>
              <span className="text-amber-300 font-bold">{maxBlockChars} chars</span>
            </div>
            <input
              id="max-block-chars-slider"
              type="range"
              min={200}
              max={800}
              step={20}
              value={maxBlockChars}
              disabled={isGenerating}
              onChange={(e) => onChangeMaxChars(Number(e.target.value))}
              className="w-36 accent-amber-500 cursor-pointer"
            />
            <div className="flex gap-1 text-[10px] font-mono">
              {[300, 400, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeMaxChars(preset)}
                  disabled={isGenerating}
                  className={`px-1.5 py-0.5 rounded border transition-colors ${
                    maxBlockChars === preset
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <button
            id="prepare-script-btn"
            type="button"
            onClick={onPrepareScript}
            disabled={!script.trim() || isGenerating}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-zinc-950" />
            <span>{isPrepared ? 'Re-Prepare Script' : 'Prepare Script'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
