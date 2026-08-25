"""Evaluasi ablation: rewrite ON vs OFF pada skenario multi-turn.

Cara pakai:
  python evaluation/evaluate_ablation.py

Membandingkan perilaku chatbot pada follow-up (turn 2) dengan dua kondisi:
  - rewrite ON:  history percakapan dipertahankan -> query di-rewrite jadi mandiri
  - rewrite OFF: tanpa history -> turn 2 polos tanpa konteks turn 1

Metrik per sisi:
  - tidak_tersedia (boolean): jawaban "informasi tidak tersedia"
  - answer_relevancy (LLM-judge): relevansi turn 2 vs jawaban (tanpa konteks)
  - conversational_relevancy (LLM-judge): relevansi turn 2 dlm konteks turn 1
    (menangkap apakah subjek follow-up sesuai topik turn 1)

Hasil ditulis ke evaluation/data/results_ablation.json.
"""
import sys
import os
import json

from evaluation.eval_common import (
    DATA, PROMPT_JUDGE, ask_judge, save_json, load_scenarios, tidak_tersedia,
)

from src.rag.chain import build_rag_chain
from src.rag.history import clear_session


def mode_ablation():
    scenarios = load_scenarios()
    print(f"Total skenario: {len(scenarios)}", flush=True)

    rag = build_rag_chain()
    chain = rag["chain"]
    judge = rag["llm"]

    rows = []
    for sc in scenarios:
        t1, t2 = sc["turn1"], sc["turn2"]
        # ON: session sama (history dipertahankan)
        sid = "ablation-on-" + os.urandom(4).hex()
        chain.invoke({"input": t1}, config={"configurable": {"session_id": sid}})
        r2_on = chain.invoke({"input": t2}, config={"configurable": {"session_id": sid}})
        clear_session(sid)
        # OFF: session baru utk turn2 (tanpa history)
        sid2 = "ablation-off-" + os.urandom(4).hex()
        r2_off = chain.invoke({"input": t2}, config={"configurable": {"session_id": sid2}})
        clear_session(sid2)

        a_on, a_off = r2_on.get("answer", ""), r2_off.get("answer", "")
        rows.append({
            "id": sc["id"], "turn1": t1, "turn2": t2,
            "rewrite_on": {
                "jawaban": a_on,
                "tidak_tersedia": tidak_tersedia(a_on),
                "answer_relevancy": ask_judge(judge, PROMPT_JUDGE["answer_relevancy"].format(pertanyaan=t2, jawaban=a_on)),
                "conversational_relevancy": ask_judge(judge, PROMPT_JUDGE["conversational_relevancy"].format(turn1=t1, turn2=t2, jawaban=a_on)),
            },
            "rewrite_off": {
                "jawaban": a_off,
                "tidak_tersedia": tidak_tersedia(a_off),
                "answer_relevancy": ask_judge(judge, PROMPT_JUDGE["answer_relevancy"].format(pertanyaan=t2, jawaban=a_off)),
                "conversational_relevancy": ask_judge(judge, PROMPT_JUDGE["conversational_relevancy"].format(turn1=t1, turn2=t2, jawaban=a_off)),
            },
        })
        print(f"[{sc['id']:2d}/{len(scenarios)}] ON_ta={tidak_tersedia(a_on)} OFF_ta={tidak_tersedia(a_off)} | {t2[:50]}", flush=True)

    def agg(kunci):
        ta = sum(1 for r in rows if r[kunci]["tidak_tersedia"])
        rel = [r[kunci]["answer_relevancy"] for r in rows if r[kunci]["answer_relevancy"] is not None]
        crel = [r[kunci]["conversational_relevancy"] for r in rows if r[kunci]["conversational_relevancy"] is not None]
        return {
            "tidak_tersedia": ta,
            "%tidak_tersedia": round(100 * ta / len(rows), 1),
            "answer_relevancy_mean": round(sum(rel) / len(rel), 3) if rel else None,
            "conversational_relevancy_mean": round(sum(crel) / len(crel), 3) if crel else None,
        }

    summary = {
        "n_skenario": len(rows),
        "rewrite_on": agg("rewrite_on"),
        "rewrite_off": agg("rewrite_off"),
    }
    save_json(os.path.join(DATA, "results_ablation.json"), {"summary": summary, "per_skenario": rows})
    print("\n=== RINGKASAN ABLATION ===")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    mode_ablation()