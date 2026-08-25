"""Uji batch semua pertanyaan di questions.txt (sesi terpisah per pertanyaan).

Hasil ditulis inkremental ke data/results_batch.jsonl agar aman dari timeout.
"""
import sys
import os
import json
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.rag.chain import build_rag_chain

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUESTIONS_FILE = os.path.join(ROOT, "evaluation", "data", "questions.txt")
OUT_FILE = os.path.join(ROOT, "evaluation", "data", "results_batch.jsonl")


def parse_questions(path):
    questions = []
    kategori = "UMUM"
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line.strip():
                continue
            if line.strip().startswith("====="):
                continue
            if line.strip().startswith(("BAB", "PERTANYAAN", "DAFTAR", "Berdasarkan", "~")):
                kategori = line.strip()
                continue
            if line.startswith("Daftar") or "=====" in line:
                continue
            q = line.strip()
            if q:
                questions.append((kategori, q))
    return questions


def main():
    questions = parse_questions(QUESTIONS_FILE)
    seen = set()
    unik = []
    for kategori, q in questions:
        key = q.strip().lower()
        if key in seen:
            continue
        seen.add(key)
        unik.append((kategori, q))

    print(f"Total baris pertanyaan: {len(questions)}")
    print(f"Setelah deduplikasi:    {len(unik)}\n", flush=True)

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    sudah = set()
    if os.path.exists(OUT_FILE):
        with open(OUT_FILE, encoding="utf-8") as f:
            for line in f:
                try:
                    sudah.add(json.loads(line)["pertanyaan"])
                except (json.JSONDecodeError, KeyError):
                    pass

    print("Membuat RAG chain...", flush=True)
    rag = build_rag_chain()
    chain = rag["chain"]

    hasil = 0
    gagal = 0
    with open(OUT_FILE, "a", encoding="utf-8") as f:
        for kategori, q in unik:
            if q in sudah:
                hasil += 1
                continue
            t0 = time.time()
            try:
                result = chain.invoke(
                    {"input": q},
                    config={"configurable": {"session_id": f"batch-{os.urandom(8).hex()}"}},
                )
                answer = result.get("answer", "")
                context = result.get("context", [])
                pages = [d.metadata.get("page") for d in context]
                miss = answer.strip().lower().startswith("maaf, informasi tidak tersedia")
                record = {
                    "kategori": kategori,
                    "pertanyaan": q,
                    "jawaban": answer,
                    "sumber_pages": pages,
                    "waktu_detik": round(time.time() - t0, 2),
                    "tidak_tersedia": miss,
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
                f.flush()
                if miss:
                    gagal += 1
                status = "MISS" if miss else "ok"
                print(f"[{hasil+1:3d}/{len(unik):3d}] {status} | {q[:70]}", flush=True)
            except Exception as e:
                record = {
                    "kategori": kategori,
                    "pertanyaan": q,
                    "jawaban": "",
                    "sumber_pages": [],
                    "waktu_detik": round(time.time() - t0, 2),
                    "tidak_tersedia": True,
                    "error": str(e),
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
                f.flush()
                gagal += 1
                print(f"[{hasil+1:3d}/{len(unik):3d}] ERR | {q[:70]} | {str(e)[:60]}", flush=True)
            hasil += 1

    print(f"\nSelesai. Total diproses: {hasil}, gagal/tidak tersedia: {gagal}")
    print(f"Hasil: {OUT_FILE}")


if __name__ == "__main__":
    main()