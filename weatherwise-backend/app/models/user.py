from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: f"usr_{__import__('uuid').uuid4().hex[:12]}")
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # None for Google-only users
    name = Column(String(255), nullable=False)

    # Role and subscription - matching frontend
    role = Column(String(20), default="General")  # Farmer, Traveler, Officer, General
    tier = Column(String(30), default="Free Account")  # Free Account, Premium Intelligence, Enterprise Node
    location_default = Column(String(255), nullable=True)

    # Auth provider info
    auth_provider = Column(String(20), default="email")  # "email" or "google"
    google_id = Column(String(255), nullable=True)

    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Email verified
    is_superuser = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email}>"


class RefreshToken(Base):
    """Refresh token model for token rotation."""
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=lambda: f"rt_{__import__('uuid').uuid4().hex[:12]}")
    user_id = Column(String, nullable=False, index=True)
    token_hash = Column(String(255), nullable=False)
    token_jti = Column(String(255), nullable=False, unique=True, index=True)  # JWT ID for revocation

    # Device info
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(50), nullable=True)

    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Status
    is_revoked = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<RefreshToken {self.id}>"


class PasswordResetToken(Base):
    """Password reset token model."""
    __tablename__ = "password_reset_tokens"

    id = Column(String, primary_key=True, default=lambda: f"prt_{__import__('uuid').uuid4().hex[:12]}")
    user_id = Column(String, nullable=False, index=True)
    token_hash = Column(String(255), nullable=False)
    token_jti = Column(String(255), nullable=False, unique=True, index=True)

    # Expiration - 15 minutes
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Status
    is_used = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<PasswordResetToken {self.id}>"