"""Renders a batch of lines with one Piper model. Reads a JSON job on stdin:
{"model": "path.onnx", "speaker": 3 | null, "length_scale": 1.1, "noise_scale": 0.5, "noise_w": 0.6, "items": [{"text": "...", "out": "x.wav"}]}
Loading the model once per batch is what makes ~2000 lines take minutes, not hours.
Needs `pip install piper-tts` (https://github.com/OHF-Voice/piper1-gpl)."""
import json, sys, wave
from piper import PiperVoice, SynthesisConfig

job = json.load(sys.stdin)
voice = PiperVoice.load(job["model"])
cfg = SynthesisConfig(speaker_id=job.get("speaker"), length_scale=job.get("length_scale", 1.0),
                      noise_scale=job.get("noise_scale"), noise_w_scale=job.get("noise_w"))
for item in job["items"]:
    with wave.open(item["out"], "wb") as f:
        voice.synthesize_wav(item["text"], f, syn_config=cfg)
