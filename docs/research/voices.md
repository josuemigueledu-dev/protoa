# Voices: Piper for the cast (2026-10-24)

The owner decided: start with **Piper** (free, open source, no account) and keep the provider replaceable. So this note skips a provider comparison and records which Piper German voices we use for whom, their licences, size, and how to switch.

## What Piper offers in German

Source: the model list `voices.json` and each voice's `MODEL_CARD` in https://huggingface.co/rhasspy/piper-voices (read 2026-10-24); engine https://github.com/OHF-Voice/piper1-gpl (`piper-tts` 1.8.0 on PyPI, installed and run for this note).

| Voice | Speakers | Quality | Model size | Dataset licence |
|---|---|---|---|---|
| thorsten | 1 (male) | high / medium / low | 113 / 63 / 63 MB | CC0 |
| thorsten_emotional | 8 emotions | medium | 76 MB | CC0 |
| kerstin | 1 (female) | low | 63 MB | CC0 |
| mls | 236 | medium | 76 MB | CC-BY 4.0 (OpenSLR 94, Multilingual LibriSpeech) |
| karlsson, ramona, eva_k | 1 each | low / x_low | 20–63 MB | M-AILABS, model card says "see URL": unchecked, not used |
| pavoque | 1 | low | 63 MB | CC BY-NC-SA 4.0: **non-commercial, cannot be used in a paid app** |

Licence reading is mine, not legal advice. The audio we render is derived from the model, so CC0 needs nothing; CC-BY needs a credit line ("Voices: Multilingual LibriSpeech, CC BY 4.0") in the app's credits. Piper itself (GPL-3) runs only on our build machine and ships no code to learners.

## The cast

`scripts/voices/cast.mjs` holds the mapping. Only one of Piper's German voices is "high" quality (thorsten), so it gets the most-heard speaker; the rest come from the 236-speaker MLS model, where I chose speakers by measured pitch (median f0 of the same sentence, autocorrelation) because I cannot listen. **The owner should listen to the five samples in the PR and say which to swap**; swapping is a one-line change and only changed lines re-render.

| Speaker | Used for | Voice | Measured f0 |
|---|---|---|---|
| Protoa | headwords, example sentences, model learner lines, grammar | thorsten-high | male, low |
| Herr Weber | his lines | mls speaker 42 | about 109 Hz (low male) |
| Ana | her lines | mls speaker 144 | about 222 Hz (female) |
| Lena | her lines | mls speaker 66 | about 206 Hz (female) |
| Murat, the barista | his lines | mls speaker 132 | about 139 Hz (male, higher than Weber) |

Not possible with Piper: Ana's light Spanish accent and Lena's light Italian accent. Piper's German models are native speakers; accents would need a paid voice or a multilingual model. Treat the accent as a later upgrade, not a blocker.

## Size and cost

All 346 lines in lessons 1–8 (5,719 characters) render to Opus mono at 24 kbps: **2.2 MB in total** (about 6 KB a line), which a phone can cache. Rendering takes a few minutes on a CPU, once; later runs skip every line whose text and voice are unchanged. At 60 lessons expect roughly 15–20 MB. Cost: nothing but compute.

Lines with `{name}` / `{city}` / `{field}` (23 so far) depend on the learner's profile, so they are not pre-rendered; the device voice reads them. Latency for live AI conversation is not solved by this: those replies are new text, so they need either the device voice or a streaming TTS (see below).

## How to run it

```
pip install piper-tts      # plus ffmpeg on the machine
node scripts/voices.mjs list      # lines per speaker
node scripts/voices.mjs models    # downloads about 190 MB of models once to .cache/voices/
node scripts/voices.mjs render    # writes apps/deutsch/audio/*.opus and manifest.json
```

`PIPER_PYTHON` points at the Python with piper installed; `PIPER_MODELS` and `VOICES_OUT` move the model and output folders. The audio folder is not committed; the deploy step runs `render`.

The page loads `audio/manifest.json` at start (`loadVoxManifest` in core.js) and plays a line from it when its text matches; otherwise, or if a file fails, the device voice speaks as before.

## Swapping the provider

A provider is an object with `id`, `voiceKey(voice)` and `renderBatch({ voice, items })` (see `scripts/voices/providers/piper.mjs`). Adding ElevenLabs, Azure Neural or Google Cloud means writing a second file with those members and giving the cast entries that provider's voice names. The cache key includes the voice, so a new voice re-renders everything and nothing else. For live conversation replies a hosted streaming TTS is the only realistic route; that is a paid decision for later.

## Recommendation

Ship Piper now: thorsten-high for Protoa and the MLS voices for the cast, after the owner listens to the samples. Re-evaluate a paid voice when (a) the owner wants Spanish- and Italian-tinted accents for Ana and Lena, or (b) the AI conversation should speak. Known gap: I have not measured intelligibility (the old notes suggested a speech-recogniser WER check); that needs a German ASR model and can follow.
