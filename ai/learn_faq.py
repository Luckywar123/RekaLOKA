#!/usr/bin/env python3
"""
RekaLOKA — belajar FAQ dataset (lokal)
Mode:
  1) sklearn TF-IDF  → ringan, tanpa neural
  2) sentence-transformers → semantic lebih pintar (opsional)

Jalankan:
  pip install -r requirements.txt
  python learn_faq.py                 # interaktif CLI
  python learn_faq.py --serve         # API lokal :8765
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "faq_dataset.json"

# Coba import semantic model; fallback TF-IDF
USE_ST = False
try:
    from sentence_transformers import SentenceTransformer, util
    USE_ST = True
except Exception:
    USE_ST = False

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def load_faq(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def flatten(item: dict) -> str:
    qs = item.get("q") or []
    if isinstance(qs, str):
        qs = [qs]
    tags = item.get("tags") or []
    return " ".join(qs + tags)


def normalize(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s


class FAQBrain:
    def __init__(self, items: list[dict]):
        self.items = items
        self.corpus = [normalize(flatten(x)) for x in items]
        self.model = None
        self.emb = None
        self.vec = None
        self.matrix = None

        if USE_ST:
            print("[brain] sentence-transformers aktif")
            self.model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
            self.emb = self.model.encode(self.corpus, convert_to_tensor=True)
        else:
            print("[brain] fallback TF-IDF (sklearn)")
            self.vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
            self.matrix = self.vec.fit_transform(self.corpus)

    def query(self, text: str, top_k: int = 3) -> list[tuple[dict, float]]:
        q = normalize(text)
        if not q:
            return []
        if USE_ST and self.model is not None:
            qe = self.model.encode(q, convert_to_tensor=True)
            scores = util.cos_sim(qe, self.emb)[0].cpu().numpy()
        else:
            qv = self.vec.transform([q])
            scores = cosine_similarity(qv, self.matrix)[0]
        idx = np.argsort(scores)[::-1][:top_k]
        out = []
        for i in idx:
            if scores[i] < 0.08:
                continue
            out.append((self.items[int(i)], float(scores[i])))
        return out

    def answer(self, text: str) -> str:
        hits = self.query(text, top_k=1)
        if not hits:
            return (
                "Saya belum menemukan jawaban yang cocok di dataset. "
                "Coba tanya layanan, kemitraan, harga, atau kontak — "
                "atau isi form Kemitraan di website."
            )
        item, score = hits[0]
        return f"{item['a']}\n\n(skor kecocokan: {score:.2f})"


def run_cli(brain: FAQBrain) -> None:
    print("RekaLOKA FAQ Brain — ketik pertanyaan (atau 'exit')\n")
    while True:
        try:
            q = input("Anda> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not q or q.lower() in {"exit", "quit", "q"}:
            break
        print("Bot>", brain.answer(q))
        print()


def run_server(brain: FAQBrain, host: str = "127.0.0.1", port: int = 8765) -> None:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn

    app = FastAPI(title="RekaLOKA FAQ Brain")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class Ask(BaseModel):
        text: str

    @app.get("/health")
    def health():
        return {"ok": True, "engine": "sentence-transformers" if USE_ST else "tfidf"}

    @app.post("/ask")
    def ask(body: Ask):
        hits = brain.query(body.text, top_k=3)
        best = hits[0] if hits else None
        return {
            "answer": best[0]["a"] if best else None,
            "score": best[1] if best else 0.0,
            "fallback": brain.answer(body.text) if not best else None,
            "candidates": [
                {"answer": h[0]["a"], "score": h[1], "tags": h[0].get("tags")}
                for h in hits
            ],
        }

    print(f"[serve] http://{host}:{port}/ask")
    uvicorn.run(app, host=host, port=port)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", action="store_true")
    parser.add_argument("--data", type=Path, default=DATA_PATH)
    args = parser.parse_args()

    items = load_faq(args.data)
    # Merge dari faq-data.js jika ingin: user bisa export manual ke JSON
    brain = FAQBrain(items)

    if args.serve:
        run_server(brain)
    else:
        run_cli(brain)


if __name__ == "__main__":
    main()
