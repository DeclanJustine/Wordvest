"""Evaluasi kualitas jawaban chatbot RAG.

Cara pakai:
  python evaluation/evaluate_kualitas.py                # 4 metrik pada 30 pertanyaan berlabel
  python evaluation/evaluate_kualitas.py faktual        # scoring manual factual (30 sampel)

Sampel = 30 pertanyaan dari evaluation/data/labels_retrieval.json (halaman relevan
dari keyword search di buku, independen dari retriever). Setiap pertanyaan dinilai
dengan 4 metrik:
  - answer_relevancy  (LLM-judge)      - faithfulness (LLM-judge)
  - context_recall    (objektif)       - context_precision (objektif, gaya RAGAS)

Hasil ditulis ke evaluation/data/results_quality.jsonl & summary_quality.json.
"""
import sys
import os
import json
import csv
import time

from evaluation.eval_common import (
    DATA, BATCH, LABELS, CSV_FILE, K, RANDOM_SEED,
    PROMPT_JUDGE, fmt_konteks, ask_judge, load_jsonl, save_json, load_labels,
)

from src.rag.chain import get_llm, normalisasi
from src.rag.store import get_retriever


def mode_kualitas():
    labels = load_labels()
    batch = {r["pertanyaan"]: r for r in load_jsonl(BATCH)}
    print(f"Total label: {len(labels)} (k={K})", flush=True)

    out_file = os.path.join(DATA, "results_quality.jsonl")
    sudah = {r["pertanyaan"] for r in load_jsonl(out_file)}
    print(f"Sudah dinilai: {len(sudah)}", flush=True)

    llm = get_llm()
    retriever = get_retriever()

    with open(out_file, "a", encoding="utf-8") as f:
        for i, item in enumerate(labels, 1):
            q = item["pertanyaan"]
            if q in sudah:
                continue
            gt = set(item["halaman_relevan"])
            jawaban = batch.get(q, {}).get("jawaban", "")
            try:
                docs = retriever.invoke(normalisasi(q))
            except Exception as e:
                docs = []
                print(f"      [retriever error] {str(e)[:60]}", flush=True)
            pages = [d.metadata.get("page") for d in docs]
            konteks = fmt_konteks(docs)

            # Objektif: recall vs halaman relevan buku
            hits = set(pages) & gt
            c_recall = len(hits) / len(gt) if gt else 0.0

            # context_precision gaya RAGAS (rank-aware, halaman unik):
            # untuk tiap halaman relevan di posisi i, precision@i = jml relevan s.d. i / i,
            # lalu rata-rata. Halaman duplikat tidak dihitung ulang.
            uniq = []
            for p in pages:
                if p not in uniq:
                    uniq.append(p)
            relevan_ke = 0
            prec_vals = []
            for i, p in enumerate(uniq, 1):
                if p in gt:
                    relevan_ke += 1
                    prec_vals.append(relevan_ke / i)
            c_precision = (sum(prec_vals) / len(prec_vals)) if prec_vals else 0.0

            t0 = time.time()
            skor = {
                "answer_relevancy": ask_judge(llm, PROMPT_JUDGE["answer_relevancy"].format(pertanyaan=q, jawaban=jawaban)),
                "faithfulness": ask_judge(llm, PROMPT_JUDGE["faithfulness"].format(pertanyaan=q, konteks=konteks, jawaban=jawaban)),
                "context_recall": round(c_recall, 3),
                "context_precision": round(c_precision, 3),
            }
            rec = {
                "pertanyaan": q,
                "halaman_relevan": sorted(gt),
                "halaman_retrieved": pages,
                "jawaban": jawaban,
                "skor": skor,
                "waktu_detik": round(time.time() - t0, 2),
            }
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            f.flush()
            sudah.add(q)
            print(f"[{i:2d}/{len(labels)}] {q[:45]:47s} rel={skor['answer_relevancy']} "
                  f"faith={skor['faithfulness']} cRec={skor['context_recall']} cPrec={skor['context_precision']}", flush=True)

    ringkas()


def ringkas():
    """Ringkasan agregat 4 metrik dari hasil yang sudah dinilai."""
    hasil = load_jsonl(os.path.join(DATA, "results_quality.jsonl"))
    if not hasil:
        print("Belum ada hasil. Jalankan: python evaluation/evaluate_kualitas.py")
        return
    metrik = ["answer_relevancy", "faithfulness", "context_recall", "context_precision"]
    ringkasan = {}
    for m in metrik:
        vals = [r["skor"][m] for r in hasil if r["skor"].get(m) is not None]
        ringkasan[m] = {
            "mean": round(sum(vals) / len(vals), 3) if vals else None,
            "min": round(min(vals), 2) if vals else None,
            "n": len(vals),
        }
    save_json(os.path.join(DATA, "summary_quality.json"), {
        "n_sampel": len(hasil),
        "konfigurasi": "k=10, seed=42, qwen3:8b (judge=generator), bge-m3",
        "metrik": ringkasan,
        "catatan": ("answer_relevancy & faithfulness = LLM-judge. context_recall = objektif "
                    "vs halaman buku. context_precision = gaya RAGAS (rank-aware, halaman unik). "
                    "Factual correctness via mode faktual."),
    })
    print(f"\n=== RINGKASAN ({len(hasil)} sampel) ===")
    print(json.dumps(ringkasan, indent=2))


# ---------------------------------------------------------------------------
# Mode faktual (scoring manual 1-5, oleh manusia)
# ---------------------------------------------------------------------------
RUBRIK = """RUBRIK SKOR FAKTUAL (1-5):
5 = benar & lengkap, semua poin kunci sesuai buku
4 = benar, sebagian besar poin ada, 1 detail kurang
3 = sebagian benar, beberapa poin keliru/terlewat
2 = sebagian kecil benar, mayoritas keliru
1 = salah/tidak relevan sama sekali"""


def mode_faktual(action):
    if action == "prepare":
        labels = load_labels()
        batch = {r["pertanyaan"]: r for r in load_jsonl(BATCH)}
        retriever = get_retriever()
        with open(CSV_FILE, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.writer(f)
            w.writerow(["pertanyaan", "halaman", "jawaban_sistem", "referensi_buku", "skor", "catatan"])
            for item in labels:
                q = item["pertanyaan"]
                docs = retriever.invoke(normalisasi(q))
                ref = (docs[0].page_content[:400].replace("\n", " ").strip() if docs else "(tanpa konteks)")
                w.writerow([
                    q, ";".join(str(d.metadata.get("page")) for d in docs[:3]),
                    batch.get(q, {}).get("jawaban", ""), ref, "", "",
                ])
        print(f"Sampel {len(labels)} ditulis ke: {CSV_FILE}\n{RUBRIK}\n"
              f"Isi kolom 'skor' (1-5), lalu: python evaluation/evaluate_kualitas.py faktual compute")

    elif action == "compute":
        with open(CSV_FILE, encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))
        vals = [int(r["skor"]) for r in rows if r.get("skor", "").strip().isdigit()]
        if not vals:
            print("Belum ada skor terisi.")
            return
        hasil = {
            "n": len(vals),
            "mean": round(sum(vals) / len(vals), 2),
            "distribusi": {i: vals.count(i) for i in range(1, 6)},
            "%skor_4_atau_5": round(100 * sum(1 for v in vals if v >= 4) / len(vals), 1),
        }
        save_json(os.path.join(DATA, "summary_factual.json"), hasil)
        print(json.dumps(hasil, indent=2))


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "faktual":
        mode_faktual(sys.argv[2] if len(sys.argv) > 2 else "prepare")
    else:
        mode_kualitas()


if __name__ == "__main__":
    main()
