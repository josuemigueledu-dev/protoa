"""Transcribes audio files with faster-whisper (German). Reads {"files": ["a.opus", ...]} on stdin and prints
{"a.opus": {"heard": "...", "seconds": 1.2}}. CPU int8 is fine: the course is a few minutes of audio.
Needs `pip install faster-whisper`; the first run downloads the `small` model (about 460 MB)."""
import json, sys
from faster_whisper import WhisperModel

model = WhisperModel("small", device="cpu", compute_type="int8")
out = {}
for f in json.load(sys.stdin)["files"]:
    segs, info = model.transcribe(f, language="de", beam_size=5, temperature=0)
    out[f] = {"heard": " ".join(s.text.strip() for s in segs), "seconds": info.duration}
json.dump(out, sys.stdout, ensure_ascii=False)
