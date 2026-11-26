"""Hüdhüd'ün cümlelerini hazır ses dosyalarına (MP3) çevirir.

İki motor:
  - ElevenLabs: ELEVENLABS_API_KEY ortam değişkeni (GitHub secret) ve voice-config.json'da voice_id varsa.
  - Microsoft Edge (Emel): anahtar gerekmez, yedek motor.
GitHub Actions'ta derlemeden önce çalışır. Çıktı: public/voice/<id>.mp3 ve manifest.json
"""
import asyncio
import json
import os
import re
import sys

import urllib.request

import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "voice")


def load(name):
    with open(os.path.join(ROOT, "data", name), encoding="utf-8") as f:
        return json.load(f)


cfg = load("voice-config.json")
lines = load("hudhud-lines.json")
letters = load("letters.json")


def without_name(text):
    t = re.sub(r"\s*\{ad\}", "", text)
    return re.sub(r"\s+([!?.,])", r"\1", t)


jobs = {}
for lid, text in lines.items():
    if "{ad}" in text:
        jobs[lid] = text.replace("{ad}", cfg["name"])
        jobs[f"{lid}-noname"] = without_name(text)
    else:
        jobs[lid] = text

names = letters["names"]
for a, b in letters["confusable"]:
    for x, y in ((a, b), (b, a)):
        jobs[f"harf-{ord(x):x}-{ord(y):x}"] = f"{names[x]} mi, {names[y]} mi?"


EL_KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()
EL = cfg.get("elevenlabs", {})
USE_EL = bool(EL_KEY and EL.get("voice_id")) and cfg.get("engine", "auto") in ("auto", "elevenlabs")
ENGINE = f"elevenlabs:{EL.get('voice_id')}" if USE_EL else cfg["edge"]["voice"]


def eleven(text, path):
    body = json.dumps({
        "text": text,
        "model_id": EL.get("model_id", "eleven_multilingual_v2"),
        "language_code": "tr",
        "voice_settings": {
            "stability": EL.get("stability", 0.45),
            "similarity_boost": EL.get("similarity_boost", 0.8),
            "style": EL.get("style", 0.35),
            "use_speaker_boost": True,
        },
    }).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{EL['voice_id']}?output_format=mp3_44100_128",
        data=body,
        headers={"xi-api-key": EL_KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"},
    )
    with urllib.request.urlopen(req, timeout=60) as r, open(path, "wb") as f:
        f.write(r.read())


async def make(fid, text, sem):
    path = os.path.join(OUT, f"{fid}.mp3")
    async with sem:
        for attempt in range(4):
            try:
                if USE_EL:
                    await asyncio.to_thread(eleven, text, path)
                else:
                    e = cfg["edge"]
                    c = edge_tts.Communicate(text, e["voice"], rate=e["rate"], pitch=e["pitch"])
                    await asyncio.wait_for(c.save(path), 60)
                if os.path.getsize(path) > 500:
                    return fid
            except Exception as e:  # ağ hatası: tekrar dene
                print(f"! {fid}: {e}", file=sys.stderr)
            await asyncio.sleep(1.5 * (attempt + 1))
    return None


async def main():
    os.makedirs(OUT, exist_ok=True)
    sem = asyncio.Semaphore(2 if USE_EL else 4)
    done = await asyncio.gather(*(make(k, v, sem) for k, v in jobs.items()))
    files = sorted(f for f in done if f)
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"name": cfg["name"], "voice": ENGINE, "files": files}, f, ensure_ascii=False)
    print(f"Hüdhüd sesleri: {len(files)}/{len(jobs)} üretildi ({ENGINE})")
    if not files:
        sys.exit(1)


asyncio.run(main())
