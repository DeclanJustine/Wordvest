"""Helper bersama untuk modul evaluasi (kualitas & ablation).

Berisi konstanta, prompt LLM-judge, dan fungsi utilitas yang dipakai
evaluate_kualitas.py dan evaluate_ablation.py.
"""
import sys
import os
import json
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.rag.chain import get_llm, normalisasi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "evaluation", "data")
BATCH = os.path.join(DATA, "results_batch.jsonl")       # hasil test_batch.py
LABELS = os.path.join(DATA, "labels_retrieval.json")    # 30 label halaman relevan
SCENARIOS = os.path.join(DATA, "scenarios_multiturn.json")  # 12 skenario multi-turn
CSV_FILE = os.path.join(DATA, "referensi_manual.csv")   # scoring faktual
K = 10
RANDOM_SEED = 42

# ---------------------------------------------------------------------------
# Prompt LLM-judge (gaya RAGAS). Output JSON {"skor": 0..1}
# ---------------------------------------------------------------------------
PROMPT_JUDGE = {
    "answer_relevancy": """Nilai seberapa RELEVAN jawaban terhadap pertanyaan (0.0-1.0).

Pertanyaan: {pertanyaan}
Jawaban AI: {jawaban}

- 0.9-1.0: menjawab langsung & lengkap
- 0.7-0.8: menjawab inti, ada sedikit kurang
- 0.5-0.6: sebagian relevan
- 0.0-0.4: tidak menjawab pertanyaan

HANYA JSON: {{"skor": 0.0-1.0, "alasan": "..."}}""",

    "faithfulness": """Nilai seberapa SETIA jawaban terhadap konteks (0.0-1.0), yaitu apakah semua klaim jawaban didukung konteks (tidak halusinasi).

Pertanyaan: {pertanyaan}
Konteks: {konteks}
Jawaban AI: {jawaban}

- 1.0: semua klaim didukung konteks
- 0.8-0.9: ada 1 detail kecil tidak didukung
- 0.5-0.7: beberapa klaim tidak didukung
- 0.0-0.4: banyak klaim dibuat-buat

Konteks adalah satu-satunya sumber kebenaran.

HANYA JSON: {{"skor": 0.0-1.0, "alasan": "..."}}""",

    "conversational_relevancy": """Nilai seberapa RELEVAN jawaban terhadap pertanyaan lanjutan (follow-up) DALAM KONTEKS PERCAKAPAN (0.0-1.0).

Turn 1 (pertanyaan awal): {turn1}
Turn 2 (pertanyaan lanjutan): {turn2}
Jawaban AI untuk turn 2: {jawaban}

Aturan penilaian:
- 0.9-1.0: menjawab follow-up dengan benar DAN subjeknya sesuai konteks turn 1
- 0.7-0.8: menjawab dengan benar, sedikit kekurangan
- 0.5-0.6: menjawab tapi subjek/topik kurang sesuai dengan turn 1
- 0.0-0.4: menjawab TOPIK YANG SALAH (bukan subjek yang dibahas di turn 1), atau tidak menjawab

Contoh: turn1 "Apa itu saham?" turn2 "Bagaimana cara mendapatkannya?"
- Jawaban tentang "cara membeli saham" -> 1.0
- Jawaban tentang "cara menjadi WPPE" -> 0.0 (topik melenceng dari turn 1)

HANYA JSON: {{"skor": 0.0-1.0, "alasan": "..."}}""",
}


def fmt_konteks(docs, max_len=500):
    """Ubah daftar dokumen (chunks) menjadi teks untuk prompt judge."""
    if not docs:
        return "(tidak ada konteks)"
    baris = []
    for i, d in enumerate(docs, 1):
        isi = d.page_content.strip().replace("\n", " ")
        if len(isi) > max_len:
            isi = isi[:max_len] + "..."
        baris.append(f"[{i}] (hlm. {d.metadata.get('page', '?')}) {isi}")
    return "\n".join(baris)


def parse_skor(text):
    """Ekstrak skor 0..1 dari output model (JSON murni atau bercampur teks)."""
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try:
            return float(json.loads(m.group(0))["skor"])
        except Exception:
            pass
    m = re.search(r"skor['\"]?\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)", text)
    if m:
        return float(m.group(1))
    m = re.search(r"([0-9]+(?:\.[0-9]+)?)", text)
    if m:
        return float(m.group(1))
    return None


def ask_judge(llm, prompt):
    try:
        out = llm.invoke(prompt)
        return parse_skor(out.content if hasattr(out, "content") else str(out))
    except Exception as e:
        print(f"      [judge error] {str(e)[:60]}", flush=True)
        return None


def load_jsonl(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)


def load_labels():
    with open(LABELS, encoding="utf-8") as f:
        return json.load(f)


def load_scenarios():
    with open(SCENARIOS, encoding="utf-8") as f:
        return json.load(f)


def tidak_tersedia(ans):
    return ans.strip().lower().startswith("maaf, informasi tidak tersedia")
