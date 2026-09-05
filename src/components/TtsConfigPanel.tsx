import React, { useState } from 'react';
import { Settings2, Volume2, Globe, Sliders, ChevronDown, ChevronUp, Mic, Compass, Sparkles, FileAudio } from 'lucide-react';
import { GEMINI_TTS_MODEL, GEMINI_VOICES, SUPPORTED_LOCALES } from '../constants';
import { TtsConfig } from '../types';

interface TtsConfigPanelProps {
  config: TtsConfig;
  onChangeConfig: (newConfig: TtsConfig) => void;
  isGenerating: boolean;
}

export const TtsConfigPanel: React.FC<TtsConfigPanelProps> = ({
  config,
  onChangeConfig,
  isGenerating,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const updateField = <K extends keyof TtsConfig>(field: K, value: TtsConfig[K]) => {
    onChangeConfig({
      ...config,
      [field]: value,
    });
  };

  const selectedVoice = GEMINI_VOICES.find((v) => v.id === config.voice) || GEMINI_VOICES[0];

  return (
    <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-xl overflow-hidden backdrop-blur-sm flex flex-col">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Volume2 className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">
              TTS Configuration
            </h2>
            <p className="text-xs text-zinc-400">
              Gemini 3.1 Flash TTS Preview voice & performance direction
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
          LOCKED PER-BATCH
        </span>
      </div>

      <div className="p-5 space-y-5 text-sm overflow-y-auto max-h-[640px]">
        {/* Model Display (Fixed to Gemini 3.1 Flash TTS Preview) */}
        <div>
          <label className="text-xs font-mono font-medium text-zinc-400 mb-1.5 flex items-center justify-between">
            <span>TTS MODEL</span>
            <span className="text-[10px] text-emerald-400 font-mono">OFFICIAL PREVIEW</span>
          </label>
          <div className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 font-mono text-xs text-amber-300 flex items-center justify-between">
            <span>{GEMINI_TTS_MODEL}</span>
            <span className="text-[11px] text-zinc-500">24kHz Audio</span>
          </div>
        </div>

        {/* Voice Selector */}
        <div>
          <label className="text-xs font-mono font-medium text-zinc-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              VOICE
            </span>
            <span className="text-[11px] text-zinc-500">
              {selectedVoice.gender === 'male' ? 'Male Voice' : 'Female Voice'}
            </span>
          </label>
          <select
            id="voice-select"
            value={config.voice}
            onChange={(e) => updateField('voice', e.target.value)}
            disabled={isGenerating}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-medium focus:border-amber-500 focus:outline-none transition-colors cursor-pointer"
          >
            {GEMINI_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.gender}) {v.id === 'Charon' ? '★ Recommended for Narration' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-zinc-400 leading-normal">
            {selectedVoice.description}
          </p>
        </div>

        {/* Language / Locale Selector */}
        <div>
          <label className="text-xs font-mono font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            LANGUAGE / LOCALE
          </label>
          <select
            id="locale-select"
            value={config.locale}
            onChange={(e) => updateField('locale', e.target.value)}
            disabled={isGenerating}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-medium focus:border-amber-500 focus:outline-none transition-colors cursor-pointer"
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <option key={loc.code} value={loc.code}>
                {loc.name} — {loc.nativeName} ({loc.code})
              </option>
            ))}
          </select>
        </div>

        {/* Temperature Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              TEMPERATURE
            </span>
            <span className="text-amber-300 font-bold">{config.temperature.toFixed(2)}</span>
          </div>
          <input
            id="temperature-slider"
            type="range"
            min={0.0}
            max={2.0}
            step={0.05}
            value={config.temperature}
            onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
            disabled={isGenerating}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
            <span>0.0 (Strict / Consistent)</span>
            <span>1.0 (Standard)</span>
            <span>2.0 (Dynamic)</span>
          </div>
        </div>

        {/* Audio Profile / Voice Direction */}
        <div>
          <label className="text-xs font-mono font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            VOICE DIRECTION / AUDIO PROFILE
          </label>
          <textarea
            id="voice-direction-input"
            rows={2}
            value={config.voiceDirection}
            onChange={(e) => updateField('voiceDirection', e.target.value)}
            disabled={isGenerating}
            placeholder="Ex: Narrador profissional de documentário, tom caloroso e envolvente, ritmo cadenciado e voz clara..."
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 text-xs focus:border-amber-500 focus:outline-none transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* The Scene */}
        <div>
          <label className="text-xs font-mono font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            THE SCENE
          </label>
          <textarea
            id="scene-input"
            rows={2}
            value={config.scene}
            onChange={(e) => updateField('scene', e.target.value)}
            disabled={isGenerating}
            placeholder="Ex: Estúdio acústico profissional silencioso, iluminação suave, microfone de condensador de alta definição..."
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 text-xs focus:border-amber-500 focus:outline-none transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Director's Notes & Style Instructions */}
        <div>
          <label className="text-xs font-mono font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <FileAudio className="w-3.5 h-3.5 text-emerald-400" />
            STYLE INSTRUCTIONS (DIRECTOR'S NOTES)
          </label>
          <textarea
            id="style-instructions-input"
            rows={2}
            value={config.styleInstructions}
            onChange={(e) => updateField('styleInstructions', e.target.value)}
            disabled={isGenerating}
            placeholder="Ex: Pausas naturais nas vírgulas e pontos, entonação sóbria, sem aceleração artificial..."
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 text-xs focus:border-amber-500 focus:outline-none transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Sample Context */}
        <div>
          <label className="text-xs font-mono font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            SAMPLE CONTEXT
          </label>
          <input
            id="sample-context-input"
            type="text"
            value={config.sampleContext}
            onChange={(e) => updateField('sampleContext', e.target.value)}
            disabled={isGenerating}
            placeholder="Ex: Narrando um documentário científico para YouTube sobre o universo."
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 text-xs focus:border-amber-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Collapsible Advanced Policy Settings */}
        <div className="border-t border-zinc-800/80 pt-3">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 hover:text-zinc-200 py-1"
          >
            <span className="flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
              BATCH & EXPORT SETTINGS
            </span>
            {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isAdvancedOpen && (
            <div className="mt-3 space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    MAX RETRIES
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={config.maxRetries}
                    onChange={(e) => updateField('maxRetries', parseInt(e.target.value) || 3)}
                    disabled={isGenerating}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    AUDIO FORMAT
                  </label>
                  <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono text-xs">
                    WAV (24kHz Mono)
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  OUTPUT FILENAME
                </label>
                <input
                  type="text"
                  value={config.outputFilename}
                  onChange={(e) => updateField('outputFilename', e.target.value)}
                  disabled={isGenerating}
                  placeholder="narracao_final.wav"
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed font-mono">
                Automatic retry schedule: Delay 1 = 3s, Delay 2 = 8s, Delay 3 = 15s. Sequential generation halts on persistent failure.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
