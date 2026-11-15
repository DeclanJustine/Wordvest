import sys, os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import Cookie, Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from api.auth import (
    COOKIE_NAME,
    clear_session_cookie,
    create_session,
    get_current_user,
    hash_password,
    hash_session_token,
    normalize_email,
    set_session_cookie,
    validate_email,
    validate_password,
    verify_password,
)
from api.chat_history import get_db_history
from api.db import Base, engine, get_db
from api.models import AuthSession, ChatMessage, Profile, User
from config import FRONTEND_ORIGINS
from src.kuesioner.data import load_kuesioner
from src.rag.chain import build_rag_chain


app = FastAPI(title="Asisten Pasar Modal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = None


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=255)

    @field_validator("email")
    @classmethod
    def email_valid(cls, value: str) -> str:
        return validate_email(value)

    @field_validator("password")
    @classmethod
    def password_valid(cls, value: str) -> str:
        return validate_password(value)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=255)

    @field_validator("email")
    @classmethod
    def email_valid(cls, value: str) -> str:
        return validate_email(value)


class ProfileRequest(BaseModel):
    profile: dict
    answers: list[dict]
    total_score: int = Field(ge=0)

    @field_validator("profile")
    @classmethod
    def profile_not_empty(cls, value: dict) -> dict:
        if not value:
            raise ValueError("profile tidak boleh kosong")
        return value


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message tidak boleh kosong")
        return value


def user_payload(user: User) -> dict:
    return {"id": user.id, "email": user.email}


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    global rag
    rag = build_rag_chain(history_getter=get_db_history)


@app.get("/api/kuesioner")
def get_kuesioner():
    return load_kuesioner()


@app.post("/api/auth/register")
def register(req: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    email = normalize_email(req.email)
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "Email sudah terdaftar")

    user = User(email=email, password_hash=hash_password(req.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email sudah terdaftar")
    db.refresh(user)

    token = create_session(db, user)
    set_session_cookie(response, token)
    return {"user": user_payload(user)}


@app.post("/api/auth/login")
def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == normalize_email(req.email)))
    if user is None or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Email atau password salah")

    token = create_session(db, user)
    set_session_cookie(response, token)
    return {"user": user_payload(user)}


@app.post("/api/auth/logout")
def logout(
    response: Response,
    session_token: str | None = Cookie(default=None, alias=COOKIE_NAME),
    db: Session = Depends(get_db),
):
    if session_token:
        db.execute(
            delete(AuthSession).where(
                AuthSession.token_hash == hash_session_token(session_token)
            )
        )
        db.commit()
    clear_session_cookie(response)
    return {"status": "ok"}


@app.get("/api/auth/me")
def me(user: User = Depends(get_current_user)):
    return {"user": user_payload(user)}


@app.get("/api/profile")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.get(Profile, user.id)
    if profile is None:
        return {"profile": None, "answers": [], "total_score": 0}
    return {
        "profile": profile.risk_profile,
        "answers": profile.answers,
        "total_score": profile.total_score,
    }


@app.put("/api/profile")
def save_profile(
    req: ProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.get(Profile, user.id)
    if profile is None:
        profile = Profile(
            user_id=user.id,
            risk_profile=req.profile,
            answers=req.answers,
            total_score=req.total_score,
        )
        db.add(profile)
    else:
        profile.risk_profile = req.profile
        profile.answers = req.answers
        profile.total_score = req.total_score
    db.commit()
    return {"status": "ok"}


@app.get("/api/chat/history")
def chat_history(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    rows = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.id.desc())
        .limit(200)
    ).all()
    rows.reverse()
    return {
        "messages": [
            {
                "id": row.id,
                "role": row.role,
                "content": row.content,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]
    }


@app.post("/api/chat")
def chat(req: ChatRequest, user: User = Depends(get_current_user)):
    if not rag:
        raise HTTPException(503, "Model belum siap")

    result = rag["chain"].invoke(
        {"input": req.message},
        config={"configurable": {"session_id": str(user.id)}},
    )
    return {"answer": result["answer"]}


@app.post("/api/chat/reset")
def reset_chat(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(delete(ChatMessage).where(ChatMessage.user_id == user.id))
    db.commit()
    return {"status": "ok"}
