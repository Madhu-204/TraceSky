from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import socket
from urllib.parse import urlsplit, urlunsplit
from dotenv import load_dotenv

load_dotenv()

# Database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./tracesky.db"
)


def _is_ip_literal(host: str) -> bool:
    """Check whether host is already an IP address (IPv4 or IPv6)."""
    try:
        socket.inet_aton(host)
        return True
    except OSError:
        pass
    try:
        socket.inet_pton(socket.AF_INET6, host)
        return True
    except OSError:
        return False


def normalize_db_url(url: str) -> str:
    """Normalize provider-style URLs so SQLAlchemy/psycopg2 can use them."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    # Enable SSL for cloud providers (Supabase, Neon, Render, etc.)
    if not url.startswith("sqlite") and "sslmode=" not in url:
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}sslmode=require"
    return url


def force_ipv4(url: str) -> str:
    """Force IPv4 connections when hostname resolves to IPv6 first.

    Some cloud hosts (e.g. Render free) have no IPv6 egress, so a hostname
    that resolves to IPv6 first fails with 'Network is unreachable'. The
    stable workaround is to pin an IPv4 address via libpq's hostaddr
    parameter (host remains for SSL/hostname handling).
    """
    try:
        parts = urlsplit(url)
        if not parts.hostname or "hostaddr=" in parts.query:
            return url
        if _is_ip_literal(parts.hostname):
            return url
        addr_infos = socket.getaddrinfo(
            parts.hostname, parts.port or 5432, socket.AF_INET, socket.SOCK_STREAM
        )
        ipv4 = addr_infos[0][4][0]
        separator = "&" if parts.query else "?"
        new_query = f"{parts.query}{separator}hostaddr={ipv4}"
        return urlunsplit((parts.scheme, parts.netloc, parts.path, new_query, parts.fragment))
    except Exception:
        return url


DATABASE_URL = normalize_db_url(DATABASE_URL)
if not DATABASE_URL.startswith("sqlite"):
    DATABASE_URL = force_ipv4(DATABASE_URL)

# Build engine kwargs based on database type
engine_kwargs = {
    "pool_pre_ping": True,
}

if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(DATABASE_URL, **engine_kwargs)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database - create all tables."""
    # Ensure all models are registered on Base.metadata
    from app.models import user, ai  # noqa: F401
    Base.metadata.create_all(bind=engine)