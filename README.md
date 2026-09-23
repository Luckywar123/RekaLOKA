# RekaLOKA — Modular Company Profile

Struktur file yang sudah dipisah + animasi scroll + FAQ chatbot.

## Struktur

```
/
├── index.html              ← HTML bersih (referensi CSS/JS eksternal)
├── css/
│   ├── main.css            ← semua style utama (dari <style> lama)
│   └── animations.css      ← animasi reveal, hover, stagger
├── js/
│   ├── nav.js              ← navbar scroll, mobile menu, back-to-top
│   ├── forms.js            ← Supabase form kemitraan + ulasan
│   └── animations.js       ← Intersection Observer scroll reveal
├── chatbot.css
├── chatbot.js
├── faq-data.js
├── supabase_schema.sql
└── assets/                 ← (kosong, siap untuk gambar eksternal nanti)
```

## Tech stack (semua gratis)

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Markup | HTML5 semantic | Simple, SEO-friendly |
| Style | CSS murni + custom properties | Zero dependency |
| Animasi | CSS + Intersection Observer | Performant, no library |
| Logic | Vanilla JS | Ringan |
| Backend form | Supabase (free tier) | Sudah terpasang |
| Chatbot | Pure JS dataset matching | Zero cost |
| Hosting | Vercel | Sudah dipakai |

Tidak memakai React/Vue/Next karena overkill untuk company profile statis.  
Kalau nanti mau upgrade ke Astro / Vite, struktur folder ini sudah siap.

## Fitur baru

- **Scroll reveal** otomatis pada section, card, list (fade + slide)
- **Stagger delay** antar item
- **Hover lift** pada card & row
- **Button micro-interaction**
- **Bar shimmer** halus
- **Respect `prefers-reduced-motion`**
- FAQ chatbot floating (sudah ada)

## Cara deploy

1. Extract ZIP ini
2. Ganti seluruh isi repo dengan folder ini (atau overwrite file yang ada)
3. Push ke GitHub → Vercel auto-deploy

## Catatan gambar

Saat ini gambar masih **embedded base64** di dalam `index.html` (warisan versi lama, ~8 MB).  
Nanti bisa diextract ke folder `assets/` supaya file lebih ringan. Untuk sekarang tetap jalan normal.

## Edit FAQ

Buka `faq-data.js` → tambah/edit objek `{ q: [...], a: "...", tags: [...] }`.
