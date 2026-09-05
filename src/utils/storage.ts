import { NarrationBlock, TtsConfig } from '../types';

const DB_NAME = 'gemini_narration_studio_db';
const DB_VERSION = 1;
const STORE_STATE = 'project_state';
const STORE_AUDIO = 'block_audio';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE);
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface SavedProjectState {
  script: string;
  config: TtsConfig;
  blocks: NarrationBlock[];
  updatedAt: number;
}

export async function saveProjectState(
  script: string,
  config: TtsConfig,
  blocks: NarrationBlock[]
): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction([STORE_STATE, STORE_AUDIO], 'readwrite');
    const stateStore = tx.objectStore(STORE_STATE);
    const audioStore = tx.objectStore(STORE_AUDIO);

    // Save lightweight block metadata (strip out large base64 strings to keep state fast)
    const sanitizedBlocks = blocks.map((b) => ({
      id: b.id,
      index: b.index,
      text: b.text,
      charCount: b.charCount,
      status: b.status,
      duration: b.duration,
      error: b.error,
      retryCount: b.retryCount,
      latencyMs: b.latencyMs,
      updatedAt: b.updatedAt,
      // We do NOT store audioBlobUrl in metadata as object URLs expire across reloads
    }));

    const data: SavedProjectState = {
      script,
      config,
      blocks: sanitizedBlocks as any,
      updatedAt: Date.now(),
    };

    stateStore.put(data, 'current_project');

    // Store completed block audio base64 in separate key-value entries
    for (const b of blocks) {
      if (b.audioBase64) {
        audioStore.put(b.audioBase64, b.id);
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to persist project state to IndexedDB:', err);
  }
}

export async function loadProjectState(): Promise<{
  state: SavedProjectState | null;
  audioMap: Map<string, string>;
}> {
  try {
    const db = await openDb();
    const tx = db.transaction([STORE_STATE, STORE_AUDIO], 'readonly');
    const stateStore = tx.objectStore(STORE_STATE);
    const audioStore = tx.objectStore(STORE_AUDIO);

    const stateRequest = stateStore.get('current_project');
    const state = await new Promise<SavedProjectState | null>((resolve, reject) => {
      stateRequest.onsuccess = () => resolve(stateRequest.result || null);
      stateRequest.onerror = () => reject(stateRequest.error);
    });

    const audioMap = new Map<string, string>();
    if (state && state.blocks) {
      for (const block of state.blocks) {
        const audioReq = audioStore.get(block.id);
        // eslint-disable-next-line no-await-in-loop
        const audio = await new Promise<string | null>((resolve) => {
          audioReq.onsuccess = () => resolve(audioReq.result || null);
          audioReq.onerror = () => resolve(null);
        });
        if (audio) {
          audioMap.set(block.id, audio);
        }
      }
    }

    return { state, audioMap };
  } catch (err) {
    console.warn('Could not load project state from IndexedDB:', err);
    return { state: null, audioMap: new Map() };
  }
}

export async function clearProjectStorage(): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction([STORE_STATE, STORE_AUDIO], 'readwrite');
    tx.objectStore(STORE_STATE).clear();
    tx.objectStore(STORE_AUDIO).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not clear IndexedDB project storage:', err);
  }
}
