import { LocaleOption, VoiceOption } from './types';

export const GEMINI_TTS_MODEL = 'gemini-3.1-flash-tts-preview';

export const GEMINI_VOICES: VoiceOption[] = [
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'male',
    description: 'Deep, resonant, and authoritative. Recommended for documentaries, deep dives, and long-form YouTube narrations.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'male',
    description: 'Enthusiastic, dynamic, and engaging. Great for conversational and fast-paced narrations.',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'female',
    description: 'Calm, clear, and soothing with natural cadence. Ideal for essays, guides, and educational content.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'male',
    description: 'Strong, articulate, and confident. Suited for historical storytelling and professional audiobooks.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'female',
    description: 'Modern, balanced, and articulate with crisp pronunciation.',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'female',
    description: 'Expressive and narrative-driven, excellent for literature and descriptive passages.',
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'female',
    description: 'Polished, executive, and warm, suited for documentary voice-overs.',
  },
  {
    id: 'Orpheus',
    name: 'Orpheus',
    gender: 'male',
    description: 'Warm and cinematic with theatrical depth.',
  },
];

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  { code: 'en-US', name: 'English (US)', nativeName: 'English (United States)' },
  { code: 'es-419', name: 'Spanish (Latin America)', nativeName: 'Español (Latinoamérica)' },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)' },
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
];

/**
 * 12-sentence sample narration script in Portuguese (Brazil),
 * tailored for long-form YouTube documentary storytelling.
 */
export const SAMPLE_PORTUGUESE_SCRIPT = `O cosmos sempre fascinou a humanidade desde os primeiros passos sob a abóbada estrelada. Civilizações antigas olhavam para as constelações em busca de orientação e sentido para a existência. Com a invenção dos telescópios modernos, descobrimos que o nosso planeta é apenas um pequeno ponto azul pálido em um oceano infinito.

Galáxias inteiras giram em danças gravitacionais que duram bilhões de anos. Em cada uma delas, incontáveis estrelas nascem em nebulosas brilhantes e morrem em explosões cataclísmicas de supernovas. A luz dessas explosões viaja por éons através do vácuo antes de atingir os nossos detectores na Terra.

Hoje, sondas robóticas exploram os vales congelados de Marte e os oceanos ocultos sob o gelo de luas distantes como Europa e Encélado. A cada nova imagem transmitida de volta, novas perguntas surgem sobre as origens da vida e o destino final do universo.

A busca por respostas não é apenas um esforço científico, mas uma jornada da própria consciência humana. Nós somos o cosmos contemplando a si mesmo em busca de compreensão e admiração eterna. E a jornada do conhecimento cósmico está apenas começando.`;
