"""Cek jumlah chunk di ChromaDB: total + rincian per file sumber.

Contoh:
    python scripts/cek_chunk.py
    python scripts/cek_chunk.py --dump
    python scripts/cek_chunk.py --dump --sumber "Buku 3 - Pasar Modal.pdf"
    python scripts/cek_chunk.py --dump --out data/chunks_dump.txt
"""
import argparse
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import CHROMA_DIR, COLLECTION_NAME

DEFAULT_DUMP_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "chunks_dump.txt"
)


def parse_args():
    parser = argparse.ArgumentParser(description="Cek dan dump chunk ChromaDB.")
    parser.add_argument("--dump", action="store_true", help="Tulis semua chunk ke file TXT.")
    parser.add_argument("--sumber", default=None, help='Filter satu file sumber, mis. "Buku 3 - Pasar Modal.pdf".')
    parser.add_argument("--out", default=DEFAULT_DUMP_PATH, help="Path file output dump.")
    return parser.parse_args()


def dump_chunks(collection, out_path, sumber=None):
    data = collection.get(include=["documents", "metadatas"])
    ids = data.get("ids") or []
    docs = data.get("documents") or []
    metadatas = data.get("metadatas") or []

    items = []
    for i, (cid, doc, md) in enumerate(zip(ids, docs, metadatas)):
        md = md or {}
        src = os.path.basename(str(md.get("source", "(tanpa source)")))
        if sumber and src != os.path.basename(sumber) and src != sumber:
            continue
        page = md.get("page", "-")
        items.append((i, cid, src, page, doc or ""))

    out_dir = os.path.dirname(out_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"Koleksi: {COLLECTION_NAME} | Chunk tertulis: {len(items)}\n")
        f.write("=" * 80 + "\n\n")
        for n, (i, cid, src, page, doc) in enumerate(items, start=1):
            f.write(f"=== Chunk {n}/{len(items)} | id: {cid} | sumber: {src} | halaman: {page} ===\n")
            f.write(doc)
            if not doc.endswith("\n"):
                f.write("\n")
            f.write("\n" + "-" * 80 + "\n\n")
    return len(items)


def main():
    try:
        import chromadb
    except ImportError:
        print("Paket 'chromadb' belum terinstal. Jalankan: pip install chromadb")
        raise SystemExit(1)

    if not os.path.isdir(CHROMA_DIR):
        print(f"Direktori Chroma tidak ditemukan: {CHROMA_DIR}")
        raise SystemExit(1)

    client = chromadb.PersistentClient(path=CHROMA_DIR)
    try:
        collection = client.get_collection(COLLECTION_NAME)
    except Exception:
        print(f"Koleksi '{COLLECTION_NAME}' tidak ditemukan di {CHROMA_DIR}")
        raise SystemExit(1)

    total = collection.count()
    print(f"Koleksi    : {COLLECTION_NAME}")
    print(f"Total chunk: {total}")

    data = collection.get(include=["metadatas"])
    metadatas = data.get("metadatas") or []
    per_file = Counter()
    pages = {}
    for md in metadatas:
        src = os.path.basename(str((md or {}).get("source", "(tanpa source)")))
        per_file[src] += 1
        page = (md or {}).get("page")
        if isinstance(page, int):
            lo, hi = pages.get(src, (page, page))
            pages[src] = (min(lo, page), max(hi, page))

    print(f"\nJumlah file sumber: {len(per_file)}")
    print(f"{'File':60} {'Chunk':>7}  Halaman")
    for src, n in per_file.most_common():
        pr = pages.get(src)
        pr_str = f"{pr[0]}-{pr[1]}" if pr else "-"
        print(f"{src:60} {n:>7}  {pr_str}")

    args = parse_args()
    if args.dump:
        written = dump_chunks(collection, args.out, args.sumber)
        print(f"\nDump selesai: {written} chunk -> {args.out}")


if __name__ == "__main__":
    main()
