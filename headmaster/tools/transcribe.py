"""Transcribe a Telegram voice note offline: python tools/transcribe.py <file.oga>"""
import sys
from faster_whisper import WhisperModel

model = WhisperModel("small", device="cpu", compute_type="int8")
segments, info = model.transcribe(sys.argv[1], beam_size=5, vad_filter=True)
print(" ".join(s.text.strip() for s in segments))
