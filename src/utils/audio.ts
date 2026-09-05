/**
 * Helper to convert base64 string to Uint8Array safely in browser
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Helper to create a standard 44-byte RIFF WAV header for 16-bit linear PCM
 */
export function createWavHeader(
  dataLength: number,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Uint8Array {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // "RIFF"
  view.setUint32(0, 0x52494646, false);
  // Total file length - 8
  view.setUint32(4, 36 + dataLength, true);
  // "WAVE"
  view.setUint32(8, 0x57415645, false);
  // "fmt "
  view.setUint32(12, 0x666d7420, false);
  // Subchunk1Size (16 for PCM)
  view.setUint32(16, 16, true);
  // AudioFormat (1 for PCM)
  view.setUint16(20, 1, true);
  // NumChannels
  view.setUint16(22, numChannels, true);
  // SampleRate
  view.setUint32(24, sampleRate, true);
  // ByteRate
  view.setUint32(28, byteRate, true);
  // BlockAlign
  view.setUint16(32, blockAlign, true);
  // BitsPerSample
  view.setUint16(34, bitsPerSample, true);
  // "data"
  view.setUint32(36, 0x64617461, false);
  // Subchunk2Size (data size)
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
}

/**
 * Extracts raw PCM sample bytes from a base64 encoded audio segment.
 * If it has a standard RIFF WAV header, it locates the "data" subchunk.
 * Otherwise, treats the entire buffer as raw PCM.
 */
export function extractPcmSamples(base64Data: string): Uint8Array {
  const bytes = base64ToUint8Array(base64Data);

  // Check if it starts with "RIFF"
  if (
    bytes.length >= 44 &&
    bytes[0] === 0x52 && // 'R'
    bytes[1] === 0x49 && // 'I'
    bytes[2] === 0x46 && // 'F'
    bytes[3] === 0x46 // 'F'
  ) {
    // Scan for "data" chunk (0x64, 0x61, 0x74, 0x61)
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const isDataChunk =
        bytes[offset] === 0x64 &&
        bytes[offset + 1] === 0x61 &&
        bytes[offset + 2] === 0x74 &&
        bytes[offset + 3] === 0x61;

      const chunkSize =
        bytes[offset + 4] |
        (bytes[offset + 5] << 8) |
        (bytes[offset + 6] << 16) |
        (bytes[offset + 7] << 24);

      if (isDataChunk) {
        const start = offset + 8;
        const end = Math.min(start + chunkSize, bytes.length);
        return bytes.subarray(start, end);
      }

      offset += 8 + chunkSize;
    }

    // Default fallback if chunk not cleanly found: standard 44-byte offset
    return bytes.subarray(44);
  }

  // Otherwise, it is raw PCM
  return bytes;
}

/**
 * Concatenates multiple WAV/PCM audio segments in exact sequence without quality loss or gaps.
 */
export function concatenateAudioSegments(
  audioBase64List: string[],
  sampleRate = 24000
): {
  blob: Blob;
  url: string;
  duration: number;
  totalBytes: number;
} {
  if (!audioBase64List || audioBase64List.length === 0) {
    throw new Error('No audio segments to concatenate.');
  }

  // 1. Extract PCM samples from each segment in order
  const pcmParts: Uint8Array[] = [];
  let totalSampleBytes = 0;

  for (const base64 of audioBase64List) {
    const samples = extractPcmSamples(base64);
    pcmParts.push(samples);
    totalSampleBytes += samples.length;
  }

  // 2. Allocate combined buffer and concatenate
  const combinedSamples = new Uint8Array(totalSampleBytes);
  let currentOffset = 0;
  for (const part of pcmParts) {
    combinedSamples.set(part, currentOffset);
    currentOffset += part.length;
  }

  // 3. Generate master RIFF WAV header
  const header = createWavHeader(totalSampleBytes, sampleRate, 1, 16);

  // 4. Create single consolidated WAV blob
  const wavBlob = new Blob([header, combinedSamples], { type: 'audio/wav' });
  const url = URL.createObjectURL(wavBlob);

  // PCM 16-bit 24kHz mono = 48,000 bytes per second
  const duration = +(totalSampleBytes / 48000).toFixed(2);

  return {
    blob: wavBlob,
    url,
    duration,
    totalBytes: wavBlob.size,
  };
}

/**
 * Helper to download any Blob in browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename.endsWith('.wav') ? filename : `${filename}.wav`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
