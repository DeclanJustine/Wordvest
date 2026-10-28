"""Ekstrak glosarium 'Kosa Kata' (hal. 254-261) dari ChromaDB jadi istilah.json.

Jalankan: python scripts/extract_istilah.py [--out ...]
"""
import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import CHROMA_DIR, COLLECTION_NAME

GLOSSARY_START = 251
GLOSSARY_END = 261

STOP_HEADINGS = {"DAFTAR PUSTAKA"}

MAX_DEFINISI = 800

SKIP_LINES = {
    "Buku 3 – Pasar Modal",
    "Buku 3 - Pasar Modal",
    "Seri Literasi Keuangan",
}

DEFAULT_OUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend",
    "src",
    "data",
    "istilah.json",
)


def is_headword(line):
    s = line.strip()
    if len(s) < 3 or len(s) > 60:
        return False
    if s.isdigit():
        return False
    letters = [c for c in s if c.isalpha()]
    if len(letters) < 3:
        return False
    return s == s.upper()


def merge_overlap(existing, addition, min_words=4):
    old_words = existing.split()
    new_words = addition.split()
    max_k = min(len(old_words), len(new_words))
    for k in range(max_k, min_words - 1, -1):
        if old_words[-k:] == new_words[:k]:
            return existing + " " + " ".join(new_words[k:])
    return (existing + " " + addition) if existing else addition


def clean_chunk(text):
    text = text.replace("-\n", "")
    lines = []
    for raw in text.split("\n"):
        s = " ".join(raw.split())
        if not s:
            continue
        if s in SKIP_LINES:
            continue
        if s.isdigit():
            continue
        lines.append(s)
    return lines


def main():
    parser = argparse.ArgumentParser(description="Ekstrak glosarium Kosa Kata.")
    parser.add_argument("--out", default=DEFAULT_OUT, help="Path output JSON.")
    args = parser.parse_args()

    import chromadb

    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_collection(COLLECTION_NAME)
    data = collection.get(
        where={
            "$and": [
                {"page": {"$gte": GLOSSARY_START}},
                {"page": {"$lte": GLOSSARY_END}},
            ]
        },
        include=["documents", "metadatas"],
    )

    docs = data.get("documents") or []
    metadatas = data.get("metadatas") or []
    items = sorted(
        zip(docs, metadatas),
        key=lambda dm: (int((dm[1] or {}).get("page", 0))),
    )
    print(f"Chunk glosarium: {len(items)}")

    entries = {}
    order = []
    current = None
    stopped = False
    for doc, md in items:
        if stopped:
            break
        page = int((md or {}).get("page", 0))
        for line in clean_chunk(doc or ""):
            if line.strip().upper().startswith("DAFTAR PUSTAKA"):
                stopped = True
                break
            if is_headword(line):
                current = line.strip()
                if current not in entries:
                    entries[current] = {"definisi": "", "halaman": page}
                    order.append(current)
            elif current:
                entries[current]["definisi"] = merge_overlap(
                    entries[current]["definisi"], line.strip()
                )

    result = []
    for term in order:
        definisi = re.sub(r"\s+", " ", entries[term]["definisi"]).strip()
        parts = re.split(r"(?<=[.!?])\s+", definisi)
        seen = set()
        deduped = []
        for p in parts:
            key = p.strip().lower()
            if key and key not in seen:
                seen.add(key)
                deduped.append(p.strip())
        definisi = " ".join(deduped)
        if not definisi:
            continue
        if len(definisi) > MAX_DEFINISI:
            definisi = definisi[:MAX_DEFINISI].rsplit(" ", 1)[0] + "…"
        result.append(
            {"istilah": term, "definisi": definisi, "halaman": entries[term]["halaman"]}
        )

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"Ditulis {len(result)} istilah -> {args.out}")


if __name__ == "__main__":
    main()
