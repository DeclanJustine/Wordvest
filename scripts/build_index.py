"""Build/rebuild vector store dari PDF dan artikel web."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import CHROMA_DIR
from src.document.loader import load_pdfs
from src.document.splitter import split_documents
from src.rag.store import add_documents, clear_collection


def main():
    pdf_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")

    existing = None
    try:
        from src.rag.store import get_vectorstore
        existing = get_vectorstore()._collection.count()
    except Exception:
        pass

    if existing:
        resp = input(f"\nCollection '{CHROMA_DIR}' berisi {existing} chunk. Hapus dan build ulang? (y/n): ")
        if resp.lower() != "y":
            print("Dibatalkan.")
            return
        clear_collection()

    all_docs = []


    if os.path.exists(pdf_dir) and os.listdir(pdf_dir):
        pdfs = load_pdfs(pdf_dir)
        all_docs.extend(pdfs)
    else:
        print("Tidak ada PDF")

    if not all_docs:
        print("\nTidak ada dokumen")
        return

    chunks = split_documents(all_docs)
    add_documents(chunks)

if __name__ == "__main__":
    main()
