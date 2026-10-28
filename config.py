import os

LLM_MODEL = "qwen3:8b"
JUDGE_MODELS = ("gemma3:12b", "qwen3:8b")
JUDGE_MODEL = "gemma3:12b"
JUDGE2_MODEL = "qwen3:8b"
EMBEDDING_MODEL = "BAAI/bge-m3"
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME = "pasar_modal"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
RETRIEVER_K = 10
NUM_CTX = None
NUM_PREDICT = None
THINKING = None
KEEP_ALIVE = "30m"
JUDGE_NUM_CTX = 4096
JUDGE_NUM_PREDICT = 300
JUDGE_THINKING = False
