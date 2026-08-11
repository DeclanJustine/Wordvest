from langchain_core.chat_history import InMemoryChatMessageHistory

MAX_MESSAGES = 6

store = {}


def get_session_history(session_id):
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    history = store[session_id]
    if len(history.messages) > MAX_MESSAGES:
        history.messages = history.messages[-MAX_MESSAGES:]
    return history


def clear_session(session_id):
    store.pop(session_id, None)
