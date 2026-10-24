// Who speaks, and which voice each speaker gets. The provider (Piper today) is chosen in
// scripts/voices.mjs; a speaker entry only names a model and, for multi-speaker models, a speaker id.
// Piper models: https://huggingface.co/rhasspy/piper-voices (see docs/research/voices.md for licences).
export const MODELS = {
  'de_DE-thorsten-high': { path: 'de/de_DE/thorsten/high', licence: 'CC0' },
  'de_DE-thorsten-medium': { path: 'de/de_DE/thorsten/medium', licence: 'CC0' },
  'de_DE-thorsten_emotional-medium': { path: 'de/de_DE/thorsten_emotional/medium', licence: 'CC0' },
  'de_DE-kerstin-low': { path: 'de/de_DE/kerstin/low', licence: 'CC0' },
};

// speaker id -> voice. Only single-speaker CC0 models: the 236-speaker MLS model looped and babbled
// (docs/research/voices.md). `lengthScale` > 1 slows the voice; `pitch` is a factor applied at encode time
// (0.93 = 7% lower), kept subtle so the voices stay natural. `speaker` picks a style in thorsten_emotional.
export const SPEAKERS = {
  protoa: { model: 'de_DE-thorsten-high', lengthScale: 1.1 },
  weber: { model: 'de_DE-thorsten-medium', lengthScale: 1.2, pitch: 0.93 },
  murat: { model: 'de_DE-thorsten_emotional-medium', speaker: 4, lengthScale: 1.1, pitch: 1.05 },
  ana: { model: 'de_DE-kerstin-low', lengthScale: 1.15 },
  lena: { model: 'de_DE-kerstin-low', lengthScale: 1.0, pitch: 1.04 },
};

// Content's `cast.*` ids (who / rwho in a conversation) -> speaker. Anyone not listed speaks as Protoa.
export const CAST_TO_SPEAKER = {
  'cast.weber': 'weber', 'cast.ana': 'ana', 'cast.lena': 'lena', 'cast.murat': 'murat', 'cast.barista': 'murat',
};
