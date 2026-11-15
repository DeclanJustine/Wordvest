import os

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DB_PATH = os.path.join(DATA_DIR, "app.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH.replace(os.sep, '/')}")
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]
SESSION_DAYS = int(os.getenv("SESSION_DAYS", "30"))
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"

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
