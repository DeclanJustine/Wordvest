import hashlib
import re
import secrets
import time
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Cookie, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.db import get_db
from api.models import AuthSession, User
from config import COOKIE_SECURE, SESSION_DAYS

COOKIE_NAME = "wordvest_session"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_email(email: str) -> str:
    email = normalize_email(email)
    if not EMAIL_RE.match(email):
        raise ValueError("Format email tidak valid")
    return email


def validate_password(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Password minimal 8 karakter")
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password maksimal 72 byte")
    return password


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = int((datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)).timestamp())
    db.add(AuthSession(user_id=user.id, token_hash=hash_session_token(token), expires_at=expires_at))
    db.commit()
    return token


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=SESSION_DAYS * 24 * 60 * 60,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


def get_current_user(
    session_token: str | None = Cookie(default=None, alias=COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    if not session_token:
        raise HTTPException(401, "Silakan login terlebih dahulu")

    session = db.scalar(
        select(AuthSession).where(AuthSession.token_hash == hash_session_token(session_token))
    )
    if session is None:
        raise HTTPException(401, "Sesi tidak valid")

    if session.expires_at < int(time.time()):
        db.delete(session)
        db.commit()
        raise HTTPException(401, "Sesi sudah berakhir")

    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(401, "User tidak ditemukan")
    return user
