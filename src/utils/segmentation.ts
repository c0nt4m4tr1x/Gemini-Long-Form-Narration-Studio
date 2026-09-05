import { NarrationBlock } from '../types';

/**
 * Common abbreviations in Portuguese and standard texts to avoid
 * falsely splitting sentences at their trailing periods.
 */
const COMMON_ABBREVIATIONS = new Set([
  'sr', 'sra', 'dr', 'dra', 'prof', 'profa', 'eng', 'adv',
  'ex', 'exmo', 'exma', 'etc', 'pag', 'pág', 'cap', 'art',
  'dept', 'depto', 'av', 'al', 'r', 'rod', 'sec', 'num',
  'núm', 'no', 'nº', 'obs', 'ref', 'tel', 'cia', 'mr', 'mrs',
  'ms', 'vs', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul',
  'ago', 'set', 'out', 'nov', 'dez', 'min', 'seg', 'i.e', 'e.g'
]);

/**
 * Checks if a period at index `dotIndex` is likely part of an abbreviation or decimal number.
 */
function isFalseSentenceBoundary(text: string, dotIndex: number): boolean {
  // 1. Check decimal number or formatted number: digit before and digit after (e.g. 3.14 or 1.000)
  const prevChar = dotIndex > 0 ? text[dotIndex - 1] : '';
  const nextChar = dotIndex + 1 < text.length ? text[dotIndex + 1] : '';
  if (/\d/.test(prevChar) && /\d/.test(nextChar)) {
    return true;
  }

  // 2. Check ellipsis: if dot is adjacent to another dot, it's an ellipsis
  if (prevChar === '.' || nextChar === '.') {
    return true;
  }

  // 3. Extract the preceding word up to 10 chars back
  let start = dotIndex - 1;
  while (start >= 0 && /[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9ºª]/.test(text[start])) {
    start--;
  }
  const word = text.slice(start + 1, dotIndex).toLowerCase();

  // If matched abbreviation or single letter abbreviation (e.g. "J. K. Rowling" or "A.")
  if (COMMON_ABBREVIATIONS.has(word) || (word.length === 1 && /[a-z]/i.test(word))) {
    return true;
  }

  return false;
}

/**
 * Tokenize text into complete sentences while preserving exact character order.
 */
export function tokenizeSentences(text: string): string[] {
  if (!text || !text.trim()) return [];

  const sentences: string[] = [];
  let currentStart = 0;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const char = text[i];

    // Sentence terminators: '.', '!', '?', '…'
    if (char === '.' || char === '!' || char === '?' || char === '…') {
      if (char === '.' && isFalseSentenceBoundary(text, i)) {
        continue;
      }

      // Check if this is the end of a series of punctuation marks (e.g. "!!!", "??", "...?")
      let pEnd = i;
      while (
        pEnd + 1 < len &&
        (text[pEnd + 1] === '.' ||
          text[pEnd + 1] === '!' ||
          text[pEnd + 1] === '?' ||
          text[pEnd + 1] === '…')
      ) {
        pEnd++;
      }
      i = pEnd;

      // Include any immediately following quotes or closing brackets (e.g., ." or ?")
      while (pEnd + 1 < len && /["'”»\)\]]/.test(text[pEnd + 1])) {
        pEnd++;
        i = pEnd;
      }

      // Check if followed by whitespace, newline, or end of string
      const isEnd = i + 1 >= len;
      const followedBySpace = i + 1 < len && /\s/.test(text[i + 1]);

      if (isEnd || followedBySpace) {
        const sentence = text.slice(currentStart, i + 1);
        if (sentence.trim().length > 0) {
          sentences.push(sentence.trim());
        }
        // Advance past following spaces for next start
        let nextStart = i + 1;
        while (nextStart < len && /\s/.test(text[nextStart])) {
          nextStart++;
        }
        currentStart = nextStart;
        i = nextStart - 1;
      }
    }
  }

  // Add any trailing text as final sentence
  if (currentStart < len) {
    const remaining = text.slice(currentStart).trim();
    if (remaining.length > 0) {
      sentences.push(remaining);
    }
  }

  return sentences;
}

/**
 * Segment a long-form narration script into coherent blocks obeying all rules:
 * 1. Never split a sentence in the middle.
 * 2. Never remove any text.
 * 3. Never duplicate any text.
 * 4. Preserve original order and punctuation.
 * 5. Default maximum block size: 400 characters (configurable).
 * 6. If one sentence exceeds maxBlockChars, keep it intact as its own block.
 */
export function segmentScriptIntoBlocks(
  script: string,
  maxBlockChars = 400
): NarrationBlock[] {
  if (!script || !script.trim()) return [];

  const sentences = tokenizeSentences(script);
  if (sentences.length === 0) return [];

  const blocks: NarrationBlock[] = [];
  let currentSentences: string[] = [];
  let currentLen = 0;

  function flushBlock() {
    if (currentSentences.length === 0) return;
    const blockText = currentSentences.join(' ');
    const index = blocks.length + 1;
    const padIndex = String(index).padStart(3, '0');

    blocks.push({
      id: `block-${padIndex}`,
      index,
      text: blockText,
      charCount: blockText.length,
      status: 'pending',
      retryCount: 0,
    });

    currentSentences = [];
    currentLen = 0;
  }

  for (const sentence of sentences) {
    const sentenceLen = sentence.length;

    // Rule 10: If one individual sentence exceeds maxBlockChars, keep it intact as its own block
    if (sentenceLen >= maxBlockChars) {
      // Flush anything accumulated so far
      flushBlock();
      // Add this long sentence as its own standalone block
      currentSentences.push(sentence);
      flushBlock();
      continue;
    }

    // Calculate length if we add this sentence
    // If currentSentences is empty: just sentenceLen
    // If not empty: currentLen + 1 (for space) + sentenceLen
    const candidateLen = currentSentences.length === 0 ? sentenceLen : currentLen + 1 + sentenceLen;

    if (candidateLen <= maxBlockChars) {
      currentSentences.push(sentence);
      currentLen = candidateLen;
    } else {
      // Exceeds limit: flush current block and start new block
      flushBlock();
      currentSentences.push(sentence);
      currentLen = sentenceLen;
    }
  }

  // Flush any remaining sentences
  flushBlock();

  return blocks;
}

/**
 * Estimate narration duration based on Portuguese / general speech rate
 * (average ~15 characters per second in professional narration).
 */
export function estimateNarrationDuration(charCount: number): number {
  if (!charCount || charCount <= 0) return 0;
  return Math.round(charCount / 15);
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS format
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
