# Voices: Piper for the cast (2026-10-24)

The owner decided: start with **Piper** (free, open source, no account) and keep the provider replaceable. So this note skips a provider comparison and records which Piper German voices we use for whom, their licences, size, and how to switch.

## What Piper offers in German

Source: the model list `voices.json` and each voice's `MODEL_CARD` in https://huggingface.co/rhasspy/piper-voices (read 2026-10-24); engine https://github.com/OHF-Voice/piper1-gpl (`piper-tts` 1.8.0, run for this note).

| Voice | Speakers | Quality | Dataset licence | Used |
|---|---|---|---|---|
| thorsten | 1 (male) | high / medium / low | CC0 | yes (high, medium) |
| thorsten_emotional | 8 styles | medium | CC0 | yes (style 4) |
| kerstin | 1 (female) | low | CC0 | yes |
| mls | 236 | medium | CC-BY 4.0 | **no**: see below |
| karlsson, ramona, eva_k | 1 each | low / x_low | M-AILABS, card says "see URL" (page unreachable from here) | no, licence unchecked |
| pavoque | 1 | low | CC BY-NC-SA 4.0: non-commercial | no |

Licence reading is mine, not legal advice. CC0 needs no credit. Piper itself (GPL-3) runs only on the build machine.

**Why not the 236-speaker MLS model.** My first cast used it. The owner transcribed the samples with Whisper and found Ana, Lena and Murat looping babble ("zäh, zäh, zäh"); I had chosen those speakers by pitch only and never listened. The cast is now single-speaker CC0 voices only, and an automatic check (below) listens to every line.

## The cast

`scripts/voices/cast.mjs`. Differences between people come from the voice, `length_scale` and a subtle pitch shift (ffmpeg `asetrate` plus `atempo`, at most 8%).

| Speaker | Voice | Pace | Pitch |
|---|---|---|---|
| Protoa (headwords, examples, model learner lines) | thorsten-high | 1.1 | none |
| Herr Weber | thorsten-medium | 1.2 (slower) | 0.93 (lower) |
| Murat, the barista | thorsten_emotional, style 4 | 1.1 | 1.05 |
| Ana | kerstin-low, steadier noise settings | 1.15 | none |
| Lena | kerstin-low, steadier noise settings | 1.0 | 1.04 |

Not possible with Piper: Ana's light Spanish accent and Lena's light Italian accent. Ana and Lena share one low-quality voice (16 kHz) and are the weakest: Better female voices would need a paid provider.

## The automatic check

After `render`, every new line is transcribed with faster-whisper (`small`, German, CPU int8) and compared with its text (`scripts/voices/check.mjs`, tested in `server/test/voices-check.test.js`). A line fails if the word error rate is above 0.25 **and** the character similarity is below 0.85, or if its length in seconds is implausible for its text. Failing files are deleted, so the page uses the device voice for them, and the render exits non-zero. Passes are remembered, so a re-run only listens to new lines.

**Single words are the exception.** Whisper cannot judge an isolated word: with the best voice (thorsten-high), `small` heard 13 of 34 vocabulary words correctly and `medium` 18 of 34 ("er" as "ja", "Buch" as "hm"); padding with silence or adding punctuation did not help. So a single word is held to the length rule only and is reported as unverified. This is a gap: 108 clips are not checked by ear or by machine. If the owner listens to a few, that is the best check for now.

## Results (lessons 1–8, 346 lines)

- 334 of 346 lines pass. 226 multi-word lines were verified by Whisper (214 pass); 108 single words were length-checked only.
- 12 lines fail and are left to the device voice: Ana "Ich komme aus Mexiko-Stadt. Und du?", "Ich wohne in Neukölln.", "Und du? Wohnst du auch in Neukölln?", "Ach, schön.", "Hallo! Ja, ich komme. Gehen wir ins Café?"; Lena "Aha, schön.", "Ah, Musik.", "Morgen spielen wir Fußball. Kommst du auch?"; Protoa "der Lehrer", "der Freund", "Ana wohnt in Neukölln.", "das Café" (heard as "Kaffee", a spelling variant, not necessarily a fault). Ana's voice has trouble with "Neukölln" and "schön".
- Audio size: 2.5 MB for 334 lines (Opus mono 24 kbps), about 18–20 MB at 60 lessons.
- 23 lines with `{name}` / `{city}` are not pre-rendered.

## How to run it

```
pip install piper-tts faster-whisper   # plus ffmpeg; the first check downloads the Whisper model (about 460 MB)
node scripts/voices.mjs list      # lines per speaker
node scripts/voices.mjs models    # downloads about 190 MB of models once to .cache/voices/
node scripts/voices.mjs render    # renders, checks with Whisper, writes apps/deutsch/audio/*.opus and manifest.json
node scripts/voices.mjs check     # checks lines not yet checked
```

`PIPER_PYTHON` points at the Python with piper installed; `PIPER_MODELS` and `VOICES_OUT` move the model and output folders. The audio folder is not committed; the deploy step runs `render`.

The page loads `audio/manifest.json` at start (`loadVoxManifest` in core.js) and plays a line from it when its text matches; otherwise, or if a file fails, the device voice speaks as before.

## Swapping the provider

A provider is an object with `id`, `voiceKey(voice)` and `renderBatch({ voice, items })` (see `scripts/voices/providers/piper.mjs`). Adding ElevenLabs, Azure Neural or Google Cloud means writing a second file with those members and giving the cast entries that provider's voice names. The cache key includes the voice, so a new voice re-renders everything and nothing else. For live conversation replies a hosted streaming TTS is the only realistic route; that is a paid decision for later.

## Recommendation

Ship Piper with this cast and the check. Re-evaluate a paid voice when (a) Ana and Lena need to sound better (they are the weakest) or carry a Spanish and an Italian tint, or (b) the AI conversation should speak. Ask the owner to listen to a handful of the unverified single words.
