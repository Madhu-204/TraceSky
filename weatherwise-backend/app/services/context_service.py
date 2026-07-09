import time
from typing import Optional

MAX_HISTORY = 20
CONTEXT_TTL = 3600  # 1 hour


class ConversationEntry:
    def __init__(self, role: str, text: str, intents: Optional[list[str]] = None):
        self.role = role
        self.text = text
        self.intents = intents or []
        self.timestamp = time.time()


class SessionContext:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.messages: list[ConversationEntry] = []
        self.lat: Optional[float] = None
        self.lon: Optional[float] = None
        self.last_intents: list[str] = []
        self.last_entities: dict = {}
        self.created_at = time.time()

    @property
    def is_expired(self) -> bool:
        return time.time() - self.created_at > CONTEXT_TTL

    def add_message(self, role: str, text: str, intents: Optional[list[str]] = None):
        self.messages.append(ConversationEntry(role, text, intents))
        if len(self.messages) > MAX_HISTORY:
            self.messages = self.messages[-MAX_HISTORY:]

    def get_recent_intents(self, n: int = 3) -> list[list[str]]:
        return [m.intents for m in self.messages[-n:] if m.intents]

    def get_conversation_summary(self) -> str:
        if not self.messages:
            return ""
        return " ".join(m.text for m in self.messages[-6:])


class ContextService:
    """In-memory conversation context manager."""

    def __init__(self):
        self._sessions: dict[str, SessionContext] = {}

    def _cleanup(self):
        expired = [sid for sid, ctx in self._sessions.items() if ctx.is_expired]
        for sid in expired:
            del self._sessions[sid]

    def get_or_create(self, session_id: str) -> SessionContext:
        self._cleanup()
        if session_id not in self._sessions:
            self._sessions[session_id] = SessionContext(session_id)
        return self._sessions[session_id]

    def update_location(self, session_id: str, lat: float, lon: float):
        ctx = self.get_or_create(session_id)
        ctx.lat = lat
        ctx.lon = lon

    def record_message(self, session_id: str, role: str, text: str, intents: Optional[list[str]] = None):
        ctx = self.get_or_create(session_id)
        ctx.add_message(role, text, intents)
        if intents:
            ctx.last_intents = intents
        return ctx


context_service = ContextService()
