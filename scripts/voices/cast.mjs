// Who speaks, and which voice each speaker gets. The provider (Piper today) is chosen in
// scripts/voices.mjs; a speaker entry only names a model and, for multi-speaker models, a speaker id.
// Piper models: https://huggingface.co/rhasspy/piper-voices (see docs/research/voices.md for licences).
export const MODELS = {
  'de_DE-thorsten-high': { path: 'de/de_DE/thorsten/high', licence: 'CC0' },
  'de_DE-mls-medium': { path: 'de/de_DE/mls/medium', licence: 'CC-BY 4.0 (OpenSLR 94): credit "Multilingual LibriSpeech" in the app credits' },
};

// speaker id -> voice. `lengthScale` > 1 slows the voice (learners hear 1.1 by default).
export const SPEAKERS = {
  protoa: { model: 'de_DE-thorsten-high', lengthScale: 1.1 },
  weber: { model: 'de_DE-mls-medium', speaker: 42, lengthScale: 1.1 },
  ana: { model: 'de_DE-mls-medium', speaker: 144, lengthScale: 1.1 },
  lena: { model: 'de_DE-mls-medium', speaker: 66, lengthScale: 1.1 },
  murat: { model: 'de_DE-mls-medium', speaker: 132, lengthScale: 1.1 },
};

// Content's `cast.*` ids (who / rwho in a conversation) -> speaker. Anyone not listed speaks as Protoa.
export const CAST_TO_SPEAKER = {
  'cast.weber': 'weber', 'cast.ana': 'ana', 'cast.lena': 'lena', 'cast.murat': 'murat', 'cast.barista': 'murat',
};
