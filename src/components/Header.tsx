import React from 'react';
import { Sparkles, Activity, RefreshCw, Terminal, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { GEMINI_TTS_MODEL } from '../constants';

interface HeaderProps {
  serverStatus: 'ready' | 'checking' | 'error';
  statusMessage?: string;
  isDiagnosticsOpen: boolean;
  onToggleDiagnostics: () => void;
  onResetProject: () => void;
  isGenerating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  serverStatus,
  statusMessage,
  isDiagnosticsOpen,
  onToggleDiagnostics,
  onResetProject,
  isGenerating,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight font-sans">
                Gemini Long-Form Narration Studio
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                PRO TTS
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Automated sequential voice generation for long-form scripts
            </p>
          </div>
        </div>

        {/* Model and Status Indicators */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Model Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-zinc-400 text-[11px]">MODEL:</span>
            <span className="text-amber-300 font-semibold">{GEMINI_TTS_MODEL}</span>
          </div>

          {/* Runtime Health Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
              serverStatus === 'ready'
                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
                : serverStatus === 'checking'
                ? 'bg-amber-950/30 text-amber-400 border-amber-800/40'
                : 'bg-rose-950/30 text-rose-400 border-rose-800/40'
            }`}
            title={statusMessage || 'Gemini TTS Runtime Status'}
          >
            {serverStatus === 'ready' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            {serverStatus === 'checking' && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
            {serverStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
            <span>{serverStatus === 'ready' ? 'READY' : serverStatus === 'checking' ? 'CHECKING...' : 'NOT READY'}</span>
          </div>

          {/* Diagnostics Button */}
          <button
            id="toggle-diagnostics-btn"
            onClick={onToggleDiagnostics}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
              isDiagnosticsOpen
                ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
            title="Toggle Technical Diagnostics"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Diagnostics</span>
          </button>

          {/* Reset Project Button */}
          <button
            id="reset-project-header-btn"
            onClick={onResetProject}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-300 hover:border-rose-900/50 hover:bg-rose-950/20 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset script and batch queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
