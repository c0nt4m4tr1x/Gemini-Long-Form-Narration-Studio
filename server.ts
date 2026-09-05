import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy GoogleGenAI client
let genAiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiClient;
}

// Helper to convert PCM buffer to a valid WAV buffer
function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  // Check if buffer is already a RIFF WAV container
  if (pcmBuffer.length >= 12 && pcmBuffer.toString('ascii', 0, 4) === 'RIFF') {
    return pcmBuffer;
  }
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // 1 = Linear PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Health and environment status
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    model: 'gemini-3.1-flash-tts-preview',
    hasApiKey: hasKey,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Startup validation endpoint
app.post('/api/tts/validate', async (req: Request, res: Response) => {
  try {
    const ai = getGenAI();
    // Do a lightweight verification test
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [
        {
          parts: [{ text: 'Speak only: Pronto.' }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    const audioPart = parts?.find((p: any) => p.inlineData?.data);

    if (audioPart?.inlineData?.data) {
      res.json({
        ready: true,
        model: 'gemini-3.1-flash-tts-preview',
        message: 'Gemini 3.1 Flash TTS Preview is verified and operational.',
        defaultVoice: 'Charon',
      });
    } else {
      res.json({
        ready: false,
        model: 'gemini-3.1-flash-tts-preview',
        message: 'Model responded but did not return audio data.',
      });
    }
  } catch (error: any) {
    console.error('Validation error:', error);
    res.status(500).json({
      ready: false,
      model: 'gemini-3.1-flash-tts-preview',
      message: error?.message || 'Failed to connect to Gemini TTS service.',
    });
  }
});

// Single block TTS generation endpoint
app.post('/api/tts/generate-block', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      text,
      voice = 'Charon',
      locale = 'pt-BR',
      temperature = 1.0,
      scene,
      sampleContext,
      styleInstructions,
      voiceDirection,
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Text prompt cannot be empty.' });
      return;
    }

    const ai = getGenAI();

    // Build the structured prompt respecting Google AI Studio Generate Speech format
    const promptSections: string[] = [];

    promptSections.push(
      'The following audio profile, scene, performance notes, and sample context are for direction only and should not be spoken aloud. Speak only the exact text provided in the TRANSCRIPT section below.'
    );

    if (locale) {
      promptSections.push(`TARGET LANGUAGE / LOCALE: ${locale}`);
    }

    if (voiceDirection && typeof voiceDirection === 'string' && voiceDirection.trim()) {
      promptSections.push(`AUDIO PROFILE / VOICE DIRECTION:\n${voiceDirection.trim()}`);
    }

    if (scene && typeof scene === 'string' && scene.trim()) {
      promptSections.push(`THE SCENE:\n${scene.trim()}`);
    }

    if (styleInstructions && typeof styleInstructions === 'string' && styleInstructions.trim()) {
      promptSections.push(`DIRECTOR'S NOTES & STYLE INSTRUCTIONS:\n${styleInstructions.trim()}`);
    }

    if (sampleContext && typeof sampleContext === 'string' && sampleContext.trim()) {
      promptSections.push(`SAMPLE CONTEXT:\n${sampleContext.trim()}`);
    }

    promptSections.push(`#### TRANSCRIPT\n${text.trim()}`);

    const completePrompt = promptSections.join('\n\n');

    // Call Gemini 3.1 Flash TTS Preview
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [
        {
          parts: [{ text: completePrompt }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        temperature: typeof temperature === 'number' ? Math.max(0, Math.min(2, temperature)) : 1.0,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Charon' },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    const audioPart = parts?.find((p: any) => p.inlineData?.data);

    if (!audioPart || !audioPart.inlineData?.data) {
      const textOutput = parts?.map((p: any) => p.text).filter(Boolean).join(' ') || '';
      throw new Error(
        `Gemini TTS did not return audio data. ${textOutput ? 'Model output: ' + textOutput : ''}`
      );
    }

    const rawBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
    const wavBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
    const audioBase64 = wavBuffer.toString('base64');

    // PCM 16-bit 24kHz mono = 48,000 bytes per second
    // WAV has 44 bytes header, rest is PCM data
    const pcmDataLength = wavBuffer.length > 44 ? wavBuffer.length - 44 : rawBuffer.length;
    const duration = +(pcmDataLength / 48000).toFixed(2);
    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      audioBase64,
      mimeType: 'audio/wav',
      duration,
      sampleRate: 24000,
      charCount: text.length,
      latencyMs,
      model: 'gemini-3.1-flash-tts-preview',
      voice,
    });
  } catch (error: any) {
    console.error('Error generating speech block:', error);
    const latencyMs = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to synthesize block audio.',
      latencyMs,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemini TTS Long-Form Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
