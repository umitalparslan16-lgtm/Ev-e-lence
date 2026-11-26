"""Hüdhüd'ün cümlelerini Microsoft Emel (Edge neural) sesiyle MP3'e çevirir.

GitHub Actions'ta derlemeden önce çalışır:  pip install edge-tts && python scripts/gen-voice.py
Çıktı: public/voice/<id>.mp3 ve public/voice/manifest.json
Ayarlar: data/voice-config.json (ses, hız, ton, çocuğun adı)
"""
import asyncio
import json
import os
import re
import sys

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


async def make(fid, text, sem):
    path = os.path.join(OUT, f"{fid}.mp3")
    async with sem:
        for attempt in range(4):
            try:
                c = edge_tts.Communicate(text, cfg["voice"], rate=cfg["rate"], pitch=cfg["pitch"])
                await c.save(path)
                if os.path.getsize(path) > 500:
                    return fid
            except Exception as e:  # ağ hatası: tekrar dene
                print(f"! {fid}: {e}", file=sys.stderr)
            await asyncio.sleep(1.5 * (attempt + 1))
    return None


async def main():
    os.makedirs(OUT, exist_ok=True)
    sem = asyncio.Semaphore(4)
    done = await asyncio.gather(*(make(k, v, sem) for k, v in jobs.items()))
    files = sorted(f for f in done if f)
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"name": cfg["name"], "voice": cfg["voice"], "files": files}, f, ensure_ascii=False)
    print(f"Hüdhüd sesleri: {len(files)}/{len(jobs)} üretildi ({cfg['voice']})")
    if not files:
        sys.exit(1)


asyncio.run(main())
