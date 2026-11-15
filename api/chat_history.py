from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from sqlalchemy import delete, select

from api.db import SessionLocal
from api.models import ChatMessage
from src.rag.history import MAX_MESSAGES


class DbChatMessageHistory(BaseChatMessageHistory):
    def __init__(self, user_id: int):
        self.user_id = user_id

    @property
    def messages(self) -> list[BaseMessage]:
        with SessionLocal() as db:
            rows = db.scalars(
                select(ChatMessage)
                .where(ChatMessage.user_id == self.user_id)
                .order_by(ChatMessage.id.desc())
                .limit(MAX_MESSAGES)
            ).all()
        rows.reverse()
        return [
            HumanMessage(content=row.content)
            if row.role == "user"
            else AIMessage(content=row.content)
            for row in rows
        ]

    def add_message(self, message: BaseMessage) -> None:
        if isinstance(message, HumanMessage):
            role = "user"
        elif isinstance(message, AIMessage):
            role = "assistant"
        else:
            return

        with SessionLocal() as db:
            db.add(ChatMessage(user_id=self.user_id, role=role, content=str(message.content)))
            db.commit()

    def clear(self) -> None:
        with SessionLocal() as db:
            db.execute(delete(ChatMessage).where(ChatMessage.user_id == self.user_id))
            db.commit()


def get_db_history(session_id: str) -> DbChatMessageHistory:
    return DbChatMessageHistory(int(session_id))
