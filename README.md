# Wordvest - AI Assistant Edukasi Pasar Modal

Asisten berbasis **Retrieval-Augmented Generation (RAG)** untuk menjawab pertanyaan seputar Pasar Modal Indonesia, menggunakan PDF di `data/raw/` sebagai sumber pengetahuan (utamanya buku **"Buku 3 - Pasar Modal"**).

### Fitur

- Tanya jawab interaktif via **Web UI (Next.js + FastAPI)** atau **CLI**
- Akun lokal (register/login) dengan profil risiko dan riwayat chat tersimpan di SQLite
- History-aware: bisa menanyakan follow-up tanpa kehilangan konteks
- Prompt strict anti-halusinasi (hanya jawab dari konteks, fallback `"Maaf, informasi tidak tersedia pada referensi"`)
- Normalisasi input Bahasa Indonesia (ejaan baku/tidak baku, misal "reksadana" → "reksa dana")
- Sumber: 2 PDF di `data/raw/` (`Buku 3 - Pasar Modal.pdf` 268 halaman + `Kuesioner-Profil-Risiko.pdf`), keduanya di-chunk dan diindeks ke ChromaDB (cek jumlah aktual via `python scripts/cek_chunk.py`)

### Prasyarat

- Python 3.10+
- Docker (untuk menjalankan Ollama)
- RAM 8GB+ (LLM ~4.7GB + model embedding ~470MB)

### 1. Clone & Setup

```bash
git clone https://github.com/DeclanJustine/Wordvest.git
cd Wordvest
python -m venv .venv

# Linux / Mac
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### 2. Setup Ollama (via Docker)

```bash
docker run -d --name ollama -p 11434:11434 ollama/ollama
docker exec -it ollama ollama pull qwen3:8b
docker exec -it ollama ollama pull gemma3:12b
```

Pastikan Ollama berjalan: `curl http://localhost:11434`

### 3. Siapkan PDF

Letakkan file PDF di `data/raw/` (sudah ada `Buku 3 - Pasar Modal.pdf` dan `Kuesioner-Profil-Risiko.pdf` secara default; `build_index.py` mengindeks semua PDF di folder tersebut).

### 4. Bangun Vector Index

```bash
python scripts/build_index.py
```

Proses: membaca PDF → chunking (chunk_size=500, overlap=100) → embedding (BAAI/bge-m3) → simpan ke ChromaDB di folder `chroma_db/`.

### 5. Jalankan

**CLI (Terminal):**
```bash
python cli.py
```

**Web UI (Next.js + FastAPI):**
```bash
# Terminal 1 - API
python -m uvicorn api.main:app --port 8000

# Terminal 2 - Frontend (development)
cd frontend
npm run dev
```

Untuk demo **offline**, build frontend sekali saat masih online (font Google perlu diunduh saat build), lalu jalankan hasil build:

```bash
cd frontend
npm install
npm run build
npm start
```

Frontend mem-proxy `/api` ke `http://127.0.0.1:8000`, jadi buka `http://localhost:3000` dan jangan mengakses API langsung dari browser.

### Akun & Database

- Buka `/register` untuk membuat akun, lalu `/login` untuk masuk.
- Database SQLite dibuat otomatis di `data/app.db` saat API pertama kali dijalankan.
- Sesi login disimpan sebagai cookie `HttpOnly` (`wordvest_session`) selama 30 hari.
- Profil risiko dan riwayat chat terikat ke akun; riwayat bisa dihapus dari tombol **Hapus riwayat** di Chat AI.
- Untuk mereset semua akun dan data, hentikan API lalu hapus `data/app.db`.
- Konfigurasi opsional ada di `.env` (lihat `.env.example`); tanpa `.env` semuanya memakai default lokal.

### Struktur Proyek

```
├── cli.py                   # Terminal client
├── config.py                # Konfigurasi (model, chunk size, dll)
├── api/
│   ├── main.py              # FastAPI server (auth, profil, chat)
│   ├── auth.py              # Password, session, cookie
│   ├── db.py                # Engine + session SQLite
│   ├── models.py            # Tabel user, session, profil, chat
│   └── chat_history.py      # History chat berbasis SQLite
├── scripts/
│   ├── build_index.py       # Bangun vector store dari PDF
│   └── cek_chunk.py         # Inspeksi isi ChromaDB
├── src/
│   ├── rag/
│   │   ├── chain.py         # RAG pipeline utama
│   │   ├── prompts.py       # Prompt untuk LLM
│   │   ├── store.py         # Interface ChromaDB
│   │   └── history.py       # Manajemen chat history per session
│   ├── document/
│   │   ├── loader.py        # Load PDF
│   │   └── splitter.py      # Chunking dokumen
│   └── kuesioner/
│       ├── data.py          # Load data kuesioner
│       └── extract.py       # Ekstrak PDF kuesioner
├── evaluation/              # Evaluasi sistem
│   ├── common/              # Helper, path kanonik, dan trace
│   ├── ci/                  # Statistik dan confidence interval
│   ├── benchmark/           # Batch, kualitas, ablasi, latency, sweep retrieval
│   ├── comparative/         # Runner dan analisis dua judge
│   ├── validation/          # Validasi hasil run
│   ├── reporting/           # Ekspor CSV, prompt/config, dan metadata
│   └── data/
│       ├── input/           # Pertanyaan, label, skenario, kontrol CREL
│       ├── baseline/{raw,summary}
│       ├── v2a/{raw,summary}
│       ├── v2b/{raw,summary,validation}
│       ├── v2c/{raw,analysis,sweep}
│       ├── tables/          # Tabel CSV kanonik
│       ├── manifests/       # Manifest, run metadata, prompt config
│       ├── review/          # Review manual baseline dan validasi judge
│       └── archive/         # Arsip baseline 2026-10-23
├── frontend/                # Next.js web UI
├── data/
│   ├── raw/                 # PDF sumber (2 file)
│   ├── kuesioner.json       # Data kuesioner (hasil ekstrak)
│   └── app.db               # Database akun/chat (auto-generated, jangan di-commit)
├── chroma_db/               # Vector store (auto-generated, jangan di-commit)
└── requirements.txt
```

### Catatan Penting

- File `.env`, `data/app.db`, dan folder `chroma_db/` sudah di-*gitignore* — tidak perlu diatur ulang
- Frontend production (`npm start`) bisa dipakai offline setelah `npm run build` dilakukan sekali saat online
- Model embedding (`BAAI/bge-m3`) akan ter-download otomatis saat `build_index.py` pertama kali dijalankan
- Default retriever: similarity search dengan k=10
- Evaluasi V2b memakai generator `qwen3:8b` (`num_ctx=4096`, `num_predict=512`) dan dua judge setara: `gemma3:12b` dan `qwen3:8b` (`num_ctx=4096`, `num_predict=300`, thinking off); rincian ada di `evaluation/data/manifests/MANIFEST_ENV.json`
- Skor dua judge dilaporkan terpisah dan tidak digabung; Qwen3:8b juga generator sehingga risiko self-preference dicatat
- Baseline rule dibekukan di `evaluation/data/manifests/baseline_rule_spec_v2.json`; runner judge ada di `evaluation/comparative/evaluate_judges.py`
- Semua proses berjalan lokal — tidak perlu koneksi internet setelah Ollama dan embedding model ter-download
