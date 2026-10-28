"""Jawaban FAQ dari chunk ChromaDB, opsional di-rewrite LLM (murni dari chunk).

Jalankan: python scripts/generate_faq.py --check
          python scripts/generate_faq.py --rewrite [--out ...]
Butuh Ollama (qwen3:8b) menyala hanya saat memakai --rewrite.
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import COLLECTION_NAME
from src.rag.store import get_vectorstore

QUESTIONS = [
    "Apa itu pasar modal?",
    "Apa bedanya saham dan obligasi?",
    "Apa itu IPO?",
    "Apa itu reksa dana?",
]

# Indeks kandidat chunk yang dipakai per pertanyaan (0 = top-1).
CHUNK_PICK = {
    "Apa itu reksa dana?": 1,
}

REWRITE_PROMPT = (
    "Tulis ulang kumpulan teks chunk berikut menjadi jawaban atas pertanyaan FAQ "
    "dalam Bahasa Indonesia yang rapi, berbentuk satu paragraf sedang "
    "(±4-5 kalimat) yang mengalir dan langsung ke inti. "
    "Langsung tulis jawabannya tanpa awalan seperti 'Jawaban:'. "
    "Gunakan HANYA informasi yang ada di teks-teks chunk berikut. DILARANG menambah "
    "informasi dari luar chunk dan DILARANG melengkapi kalimat yang terpotong "
    "dengan tebakan. Abaikan header buku, nomor halaman, dan artefak format PDF.\n\n"
    "Pertanyaan: {question}\n{chunks}\nJawaban:"
)

DEFAULT_OUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend",
    "src",
    "data",
    "faq-chunks.json",
)


def top_chunks(vs, question, k=3):
    results = vs.similarity_search_with_score(question, k=k)
    out = []
    for doc, score in results:
        md = doc.metadata or {}
        out.append(
            {
                "score": float(score),
                "source": os.path.basename(str(md.get("source", "(tanpa source)"))),
                "page": md.get("page", "-"),
                "text": doc.page_content or "",
            }
        )
    return out


def rewrite_answer(question, cands):
    import re

    from src.rag.chain import get_llm

    llm = get_llm()
    chunks = "\n".join(f"Teks chunk {i + 1}:\n{c['text']}" for i, c in enumerate(cands))
    prompt = REWRITE_PROMPT.format(question=question, chunks=chunks)
    result = llm.invoke(prompt)
    text = getattr(result, "content", str(result))
    text = str(text).strip()
    text = re.sub(r"^(\*\*Jawaban:\*\*|Jawaban:)\s*", "", text)
    return text.strip()


def main():
    parser = argparse.ArgumentParser(description="Cek/tulis jawaban FAQ dari chunk.")
    parser.add_argument("--check", action="store_true", help="Hanya tampilkan kandidat chunk.")
    parser.add_argument("--rewrite", action="store_true", help="Rewrite jawaban via LLM (butuh Ollama).")
    parser.add_argument("--out", default=DEFAULT_OUT, help="Path output JSON.")
    args = parser.parse_args()

    vs = get_vectorstore()
    print(f"Koleksi: {COLLECTION_NAME} | total: {vs._collection.count()} chunk\n")

    entries = []
    for q in QUESTIONS:
        cands = top_chunks(vs, q, k=3)
        print(f"Q: {q}")
        for i, c in enumerate(cands):
            snippet = c["text"][:220].replace("\n", " ")
            print(f"  [{i}] skor={c['score']:.4f} sumber={c['source']} hal={c['page']}")
            print(f"       {snippet}...")
        print()

        if args.check or not cands:
            continue
        pick = CHUNK_PICK.get(q, 0)
        best = cands[pick] if pick < len(cands) else cands[0]
        answer = best["text"]
        if args.rewrite:
            answer = rewrite_answer(q, cands)
            print(f"  rewrite: {answer[:220]}...\n")
        entries.append(
            {
                "question": q,
                "answer": answer,
                "chunk": best["text"],
                "source": best["source"],
                "page": best["page"],
                "covered": True,
            }
        )

    if args.check:
        return

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    print(f"Ditulis {len(entries)} entri -> {args.out}")


if __name__ == "__main__":
    main()
