# RekaLOKA AI — belajar dataset (Python)

Folder ini **opsional**. Website tetap jalan tanpa Python.

## Kenapa Python terpisah?

Hosting Vercel kamu statis (HTML/JS). Library AI Python butuh proses server.
Jadi:

| Lapisan | Peran |
|---------|--------|
| `chatbot.js` (frontend) | Intent + match + balasan spontan (gratis, langsung live) |
| `ai/learn_faq.py` | Belajar semantic dataset, API lokal / hosting gratis |

## Install

```bash
cd ai
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Pakai CLI

```bash
python learn_faq.py
```

## Pakai API lokal

```bash
python learn_faq.py --serve
# POST http://127.0.0.1:8765/ask  {"text":"layanan apa saja"}
```

Kalau `sentence-transformers` terpasang → semantic multilingual.  
Kalau tidak → otomatis TF-IDF (sklearn).

## Sambungkan ke website (opsional)

1. Jalankan API di lokal / Railway / Render free.
2. Di `chatbot.js`, ganti `composeReply` supaya fetch ke `/ask` bila ingin.
3. CORS sudah diizinkan (`allow_origins=["*"]`).

## Dataset

Edit `faq_dataset.json`.  
Bisa disalin manual dari `faq-data.js` (field `q`, `a`, `tags`).
