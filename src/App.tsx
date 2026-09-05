/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ScriptEditor } from './components/ScriptEditor';
import { TtsConfigPanel } from './components/TtsConfigPanel';
import { BatchControls } from './components/BatchControls';
import { ProgressDashboard } from './components/ProgressDashboard';
import { QueueList } from './components/QueueList';
import { FinalResultPanel } from './components/FinalResultPanel';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { BatchRunState, BatchStats, NarrationBlock, TtsConfig } from './types';
import { GEMINI_TTS_MODEL } from './constants';
import { segmentScriptIntoBlocks } from './utils/segmentation';
import { concatenateAudioSegments } from './utils/audio';
import { saveProjectState, loadProjectState, clearProjectStorage } from './utils/storage';

export default function App() {
  // --- Script & Config State ---
  const [script, setScript] = useState<string>('');
  const [config, setConfig] = useState<TtsConfig>({
    model: GEMINI_TTS_MODEL,
    voice: 'Charon',
    locale: 'pt-BR',
    temperature: 1.0,
    maxBlockChars: 400,
    scene: '',
    sampleContext: '',
    styleInstructions: '',
    voiceDirection: 'Narrador profissional de documentário, tom caloroso e envolvente, dicção límpida e ritmo cadenciado.',
    maxRetries: 3,
    retryDelays: [3000, 8000, 15000],
    outputFilename: 'narracao_final.wav',
  });

  // --- Queue and Execution State ---
  const [blocks, setBlocks] = useState<NarrationBlock[]>([]);
  const [isPrepared, setIsPrepared] = useState<boolean>(false);
  const [runState, setRunState] = useState<BatchRunState>('idle');
  const [currentGeneratingId, setCurrentGeneratingId] = useState<string | null>(null);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [serverStatus, setServerStatus] = useState<'ready' | 'checking' | 'error'>('checking');
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | undefined>(undefined);
  const [dbReady, setDbReady] = useState<boolean>(false);

  // --- Final Audio State ---
  const [finalWavBlob, setFinalWavBlob] = useState<Blob | null>(null);
  const [finalWavUrl, setFinalWavUrl] = useState<string | null>(null);

  // --- Audio Player Reference ---
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // --- Cancellation / Pause Tracking Refs ---
  const runStateRef = useRef<BatchRunState>('idle');
  runStateRef.current = runState;
  const cancelRequestedRef = useRef<boolean>(false);
  const pauseRequestedRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  // --- Calculate Batch Statistics ---
  const completedBlocksCount = blocks.filter((b) => b.status === 'completed').length;
  const failedBlocksCount = blocks.filter((b) => b.status === 'failed').length;
  const totalRetriesCount = blocks.reduce((acc, b) => acc + (b.retryCount || 0), 0);
  const totalCharsCount = blocks.reduce((acc, b) => acc + b.charCount, 0);
  const totalDurationSum = blocks
    .filter((b) => b.status === 'completed' && b.duration)
    .reduce((acc, b) => acc + (b.duration || 0), 0);

  const currentBlockObj = blocks.find((b) => b.id === currentGeneratingId);
  const currentBlockIndex = currentBlockObj ? currentBlockObj.index : null;

  const stats: BatchStats = {
    totalBlocks: blocks.length,
    completedBlocks: completedBlocksCount,
    failedBlocks: failedBlocksCount,
    totalRetries: totalRetriesCount,
    totalChars: totalCharsCount,
    totalGeneratedDuration: totalDurationSum,
    elapsedMs,
    currentBlockIndex,
  };

  // --- Elapsed Timer when Batch is Running ---
  useEffect(() => {
    let interval: any = null;
    if (runState === 'running') {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      interval = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedMs(Date.now() - startTimeRef.current);
        }
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [runState]);

  // --- Initial Startup Validation and Persistence Loading ---
  useEffect(() => {
    async function initialize() {
      // 1. Check server health
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setServerStatus('ready');
          setStatusMessage(`Connected. Model: ${data.model}`);
        } else {
          setServerStatus('error');
          setStatusMessage('Backend health check returned non-200 status.');
        }
      } catch (err: any) {
        setServerStatus('error');
        setStatusMessage(err?.message || 'Could not reach application server.');
      }

      // 2. Load stored project state
      try {
        const { state, audioMap } = await loadProjectState();
        if (state) {
          setScript(state.script || '');
          if (state.config) {
            setConfig(state.config);
          }
          if (state.blocks && state.blocks.length > 0) {
            const restoredBlocks: NarrationBlock[] = state.blocks.map((b) => {
              const audioBase64 = audioMap.get(b.id);
              return {
                ...b,
                audioBase64,
              };
            });
            setBlocks(restoredBlocks);
            setIsPrepared(true);

            // If all blocks were already completed, reconstruct final audio
            const allComplete = restoredBlocks.every((b) => b.status === 'completed' && b.audioBase64);
            if (allComplete) {
              const audioList = restoredBlocks.map((b) => b.audioBase64!);
              const combined = concatenateAudioSegments(audioList, 24000);
              setFinalWavBlob(combined.blob);
              setFinalWavUrl(combined.url);
              setRunState('completed');
            }
          }
        }
        setDbReady(true);
      } catch (err) {
        console.warn('Could not restore from IndexedDB:', err);
        setDbReady(true);
      }
    }

    initialize();
  }, []);

  // --- Global Audio Player Init ---
  useEffect(() => {
    const audio = new Audio();
    audio.onended = () => setActivePlayingId(null);
    audio.onerror = () => setActivePlayingId(null);
    audioPlayerRef.current = audio;

    return () => {
      audio.pause();
      audioPlayerRef.current = null;
    };
  }, []);

  // --- Prepare Script into Blocks ---
  const handlePrepareScript = useCallback(() => {
    if (!script.trim()) return;

    // Segment script into blocks
    const newBlocks = segmentScriptIntoBlocks(script, config.maxBlockChars);
    setBlocks(newBlocks);
    setIsPrepared(true);
    setRunState('idle');
    setFinalWavBlob(null);
    setFinalWavUrl(null);
    startTimeRef.current = 0;
    setElapsedMs(0);

    // Save state
    saveProjectState(script, config, newBlocks);
  }, [script, config]);

  // --- Generate Single Block Function with Retry Logic ---
  const generateBlockWithRetry = async (
    block: NarrationBlock,
    currentConfig: TtsConfig
  ): Promise<{ success: boolean; updatedBlock: NarrationBlock }> => {
    let attempt = 0;
    let lastError = '';

    while (attempt <= currentConfig.maxRetries) {
      if (cancelRequestedRef.current) {
        return {
          success: false,
          updatedBlock: { ...block, status: 'pending', error: 'Batch cancelled by user.' },
        };
      }

      // Check if paused
      while (pauseRequestedRef.current) {
        if (cancelRequestedRef.current) {
          return {
            success: false,
            updatedBlock: { ...block, status: 'pending', error: 'Batch cancelled by user.' },
          };
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      try {
        if (attempt > 0) {
          setBlocks((prev) =>
            prev.map((b) => (b.id === block.id ? { ...b, status: 'retrying', retryCount: attempt } : b))
          );
          const delay = currentConfig.retryDelays[attempt - 1] || 5000;
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const res = await fetch('/api/tts/generate-block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: block.text,
            voice: currentConfig.voice,
            locale: currentConfig.locale,
            temperature: currentConfig.temperature,
            scene: currentConfig.scene,
            sampleContext: currentConfig.sampleContext,
            styleInstructions: currentConfig.styleInstructions,
            voiceDirection: currentConfig.voiceDirection,
          }),
        });

        const data = await res.json();

        if (data.success && data.audioBase64) {
          setLastLatencyMs(data.latencyMs);
          const completedBlock: NarrationBlock = {
            ...block,
            status: 'completed',
            audioBase64: data.audioBase64,
            duration: data.duration,
            latencyMs: data.latencyMs,
            retryCount: attempt,
            error: null,
            updatedAt: Date.now(),
          };
          return { success: true, updatedBlock: completedBlock };
        } else {
          lastError = data.error || 'Server did not return audio data.';
          attempt++;
        }
      } catch (err: any) {
        lastError = err?.message || 'Network failure communicating with Gemini TTS.';
        attempt++;
      }
    }

    // All retries failed
    const failedBlock: NarrationBlock = {
      ...block,
      status: 'failed',
      error: `Failed after ${currentConfig.maxRetries} attempts: ${lastError}`,
      retryCount: currentConfig.maxRetries,
      updatedAt: Date.now(),
    };
    return { success: false, updatedBlock: failedBlock };
  };

  // --- Generate Test Block (Block 001) ---
  const handleGenerateTestBlock = async () => {
    if (blocks.length === 0) return;
    const testBlock = blocks[0];

    setCurrentGeneratingId(testBlock.id);
    setBlocks((prev) =>
      prev.map((b) => (b.id === testBlock.id ? { ...b, status: 'generating', error: null } : b))
    );

    const result = await generateBlockWithRetry(testBlock, config);

    setBlocks((prev) => {
      const updated = prev.map((b) => (b.id === testBlock.id ? result.updatedBlock : b));
      saveProjectState(script, config, updated);
      return updated;
    });

    setCurrentGeneratingId(null);

    // Auto-play the test block if successful
    if (result.success && result.updatedBlock.audioBase64 && audioPlayerRef.current) {
      handlePlayBlock(result.updatedBlock);
    }
  };

  // --- Start Full Batch Generation ---
  const handleStartFullBatch = async () => {
    if (blocks.length === 0 || runState === 'running') return;

    cancelRequestedRef.current = false;
    pauseRequestedRef.current = false;
    setRunState('running');
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    let currentQueue = [...blocks];

    for (let i = 0; i < currentQueue.length; i++) {
      const block = currentQueue[i];

      // If block is already completed, skip to next block
      if (block.status === 'completed' && block.audioBase64) {
        continue;
      }

      if (cancelRequestedRef.current) {
        setRunState('cancelled');
        setCurrentGeneratingId(null);
        return;
      }

      // Mark current block as generating
      setCurrentGeneratingId(block.id);
      currentQueue = currentQueue.map((b) =>
        b.id === block.id ? { ...b, status: 'generating', error: null } : b
      );
      setBlocks(currentQueue);

      const result = await generateBlockWithRetry(block, config);

      if (cancelRequestedRef.current) {
        setRunState('cancelled');
        setCurrentGeneratingId(null);
        return;
      }

      currentQueue = currentQueue.map((b) => (b.id === block.id ? result.updatedBlock : b));
      setBlocks(currentQueue);
      saveProjectState(script, config, currentQueue);

      if (!result.success) {
        // Block failed all retries -> Pause batch and alert user per requirement
        setRunState('error');
        setCurrentGeneratingId(null);
        return;
      }
    }

    // All blocks successfully generated! Concatenate final audio.
    setCurrentGeneratingId(null);
    setRunState('completed');

    try {
      const audioList = currentQueue.map((b) => b.audioBase64!);
      const combined = concatenateAudioSegments(audioList, 24000);
      setFinalWavBlob(combined.blob);
      setFinalWavUrl(combined.url);
    } catch (err: any) {
      console.error('Concatenation error:', err);
      setStatusMessage(`Concatenation warning: ${err?.message}`);
    }
  };

  // --- Pause Batch ---
  const handlePauseBatch = () => {
    pauseRequestedRef.current = true;
    setRunState('paused');
  };

  // --- Resume Batch ---
  const handleResumeBatch = () => {
    pauseRequestedRef.current = false;
    setRunState('running');
    handleStartFullBatch();
  };

  // --- Cancel Batch ---
  const handleCancelBatch = () => {
    cancelRequestedRef.current = true;
    pauseRequestedRef.current = false;
    setRunState('cancelled');
    setCurrentGeneratingId(null);
  };

  // --- Retry Failed Blocks ---
  const handleRetryFailed = () => {
    // Reset failed blocks to pending
    const updated = blocks.map((b) =>
      b.status === 'failed' ? { ...b, status: 'pending' as const, error: null, retryCount: 0 } : b
    );
    setBlocks(updated);
    handleStartFullBatch();
  };

  // --- Regenerate a Single Block ---
  const handleRegenerateBlock = async (blockToReroll: NarrationBlock) => {
    setCurrentGeneratingId(blockToReroll.id);
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockToReroll.id ? { ...b, status: 'generating', error: null } : b))
    );

    const result = await generateBlockWithRetry(blockToReroll, config);

    let updatedQueue: NarrationBlock[] = [];
    setBlocks((prev) => {
      updatedQueue = prev.map((b) => (b.id === blockToReroll.id ? result.updatedBlock : b));
      saveProjectState(script, config, updatedQueue);
      return updatedQueue;
    });

    setCurrentGeneratingId(null);

    // If all blocks are completed, automatically rebuild the final continuous narration per Requirement 27
    const allDone = updatedQueue.every((b) => b.status === 'completed' && b.audioBase64);
    if (allDone && updatedQueue.length > 0) {
      try {
        const audioList = updatedQueue.map((b) => b.audioBase64!);
        const combined = concatenateAudioSegments(audioList, 24000);
        setFinalWavBlob(combined.blob);
        setFinalWavUrl(combined.url);
      } catch (err) {
        console.error('Re-concatenation error:', err);
      }
    }
  };

  // --- Play/Pause Individual Block ---
  const handlePlayBlock = (block: NarrationBlock) => {
    if (!block.audioBase64 || !audioPlayerRef.current) return;

    if (activePlayingId === block.id) {
      audioPlayerRef.current.pause();
      setActivePlayingId(null);
      return;
    }

    const audioBytes = Uint8Array.from(atob(block.audioBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([audioBytes], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    audioPlayerRef.current.src = url;
    audioPlayerRef.current.play();
    setActivePlayingId(block.id);
  };

  const handlePauseBlock = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setActivePlayingId(null);
    }
  };

  // --- Reset Entire Project ---
  const handleResetProject = () => {
    if (runState === 'running') {
      alert('Cannot reset while batch generation is running. Please cancel the batch first.');
      return;
    }
    if (blocks.length > 0 && !window.confirm('Reset all blocks and script? This will clear current narration data.')) {
      return;
    }

    setScript('');
    setBlocks([]);
    setIsPrepared(false);
    setRunState('idle');
    setCurrentGeneratingId(null);
    setActivePlayingId(null);
    setFinalWavBlob(null);
    setFinalWavUrl(null);
    startTimeRef.current = 0;
    setElapsedMs(0);
    clearProjectStorage();
  };

  const hasFailedBlocks = blocks.some((b) => b.status === 'failed');
  const testBlockCompleted = blocks.length > 0 && blocks[0].status === 'completed';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Application Header */}
      <Header
        serverStatus={serverStatus}
        statusMessage={statusMessage}
        isDiagnosticsOpen={isDiagnosticsOpen}
        onToggleDiagnostics={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
        onResetProject={handleResetProject}
        isGenerating={runState === 'running'}
      />

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Collapsible Diagnostics Section */}
        <DiagnosticsPanel
          isOpen={isDiagnosticsOpen}
          onClose={() => setIsDiagnosticsOpen(false)}
          serverStatus={serverStatus}
          statusMessage={statusMessage}
          config={config}
          runState={runState}
          stats={stats}
          lastLatencyMs={lastLatencyMs}
          dbReady={dbReady}
        />

        {/* Final Result Panel (Appears when full batch is completed) */}
        {runState === 'completed' && finalWavBlob && (
          <FinalResultPanel
            finalWavBlob={finalWavBlob}
            finalWavUrl={finalWavUrl}
            totalDuration={totalDurationSum}
            totalBlocks={blocks.length}
            totalChars={totalCharsCount}
            elapsedMs={elapsedMs}
            defaultFilename={config.outputFilename}
            onRestartBatch={handleResetProject}
          />
        )}

        {/* Batch Progress Dashboard (Visible when prepared or running) */}
        {isPrepared && blocks.length > 0 && (
          <ProgressDashboard
            runState={runState}
            stats={stats}
            currentBlockDuration={currentBlockObj?.duration}
            activeBlockStatusText={
              currentBlockObj ? `Generating BLOCK ${String(currentBlockObj.index).padStart(3, '0')}...` : undefined
            }
          />
        )}

        {/* Primary Two-Column Production Workstation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Script Editor (lg: col 7) */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <ScriptEditor
              script={script}
              onChangeScript={(newText) => {
                setScript(newText);
                if (isPrepared) {
                  // Script modified after preparation: warn/flag
                  setIsPrepared(false);
                }
              }}
              maxBlockChars={config.maxBlockChars}
              onChangeMaxChars={(val) => {
                setConfig((prev) => ({ ...prev, maxBlockChars: val }));
                if (isPrepared) {
                  setIsPrepared(false);
                }
              }}
              onPrepareScript={handlePrepareScript}
              isPrepared={isPrepared}
              totalBlocks={blocks.length}
              isGenerating={runState === 'running'}
              actualDuration={runState === 'completed' ? totalDurationSum : undefined}
            />
          </div>

          {/* Right Column: TTS Configuration Panel (lg: col 5) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <TtsConfigPanel
              config={config}
              onChangeConfig={setConfig}
              isGenerating={runState === 'running'}
            />
          </div>
        </div>

        {/* Narration Queue Section */}
        {blocks.length > 0 && (
          <div className="space-y-4">
            <QueueList
              blocks={blocks}
              activePlayingId={activePlayingId}
              onPlayBlock={handlePlayBlock}
              onPauseBlock={handlePauseBlock}
              onRegenerateBlock={handleRegenerateBlock}
              isGenerating={runState === 'running'}
              currentGeneratingId={currentGeneratingId}
            />
          </div>
        )}

        {/* Bottom Control Bar */}
        {blocks.length > 0 && (
          <div className="sticky bottom-4 z-30">
            <BatchControls
              runState={runState}
              hasBlocks={blocks.length > 0}
              onPrepare={handlePrepareScript}
              onGenerateTest={handleGenerateTestBlock}
              onStartBatch={handleStartFullBatch}
              onPauseBatch={handlePauseBatch}
              onResumeBatch={handleResumeBatch}
              onCancelBatch={handleCancelBatch}
              onRetryFailed={hasFailedBlocks ? handleRetryFailed : undefined}
              hasFailedBlocks={hasFailedBlocks}
              testBlockCompleted={testBlockCompleted}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 px-6 text-center text-xs font-mono text-zinc-600">
        Gemini 3.1 Flash TTS Preview • Long-Form Narration Studio • Google AI Studio Preview
      </footer>
    </div>
  );
}
