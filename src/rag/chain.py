from langchain_ollama import ChatOllama
from langchain_classic.chains.history_aware_retriever import create_history_aware_retriever
from langchain_classic.chains.retrieval import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.runnables.history import RunnableWithMessageHistory

from config import (
    LLM_MODEL, NUM_CTX, NUM_PREDICT, THINKING, KEEP_ALIVE,
)
from src.rag.store import get_retriever
from src.rag.prompts import qa_prompt, history_rewriter_prompt
from src.rag.history import get_session_history

NORMALISASI_INPUT = {
    "reksadana": "reksa dana",
    "right issue": "hak memesan efek terlebih dahulu hmetd",
    "rights issue": "hak memesan efek terlebih dahulu hmetd",
    "idx": "bursa efek indonesia",
    "pendidikan dan pelatihan profesi": "perizinan dan sertifikasi profesi",
    "menjadi pialang": "profesi pialang broker izin wppe",
    "menentukan harga saham ipo": "cara menghitung harga wajar saham",
    "pasar modal halal": "pasar modal halal syariah",
}


def get_llm(model=LLM_MODEL, temperature=0.0, num_predict=NUM_PREDICT,
            num_ctx=NUM_CTX, reasoning=THINKING, seed=42, keep_alive=KEEP_ALIVE):
    return ChatOllama(
        model=model,
        temperature=temperature,
        num_predict=num_predict,
        num_ctx=num_ctx,
        reasoning=reasoning,
        seed=seed,
        keep_alive=keep_alive,
    )


def normalisasi(query):
    q = query.lower()
    for k, v in NORMALISASI_INPUT.items():
        q = q.replace(k, v)
    return q


def build_rag_chain(llm=None, retriever=None):
    if llm is None:
        llm = get_llm()
    if retriever is None:
        retriever = get_retriever()

    history_aware_retriever = create_history_aware_retriever(
        llm=llm,
        retriever=retriever,
        prompt=history_rewriter_prompt,
    )

    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

    chain = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )

    class NormalizedChain:
        def __init__(self, chain):
            self._chain = chain

        def invoke(self, inputs, config=None, **kwargs):
            inputs = dict(inputs)
            inputs["input"] = normalisasi(inputs.get("input", ""))
            return self._chain.invoke(inputs, config, **kwargs)

        async def ainvoke(self, inputs, config=None, **kwargs):
            inputs = dict(inputs)
            inputs["input"] = normalisasi(inputs.get("input", ""))
            return await self._chain.ainvoke(inputs, config, **kwargs)

        def astream_events(self, inputs, config=None, **kwargs):
            inputs = dict(inputs)
            inputs["input"] = normalisasi(inputs.get("input", ""))
            return self._chain.astream_events(inputs, config, **kwargs)

    return {"chain": NormalizedChain(chain), "llm": llm, "retriever": retriever}
