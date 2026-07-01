import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.models.user import User, RefreshToken, PasswordResetToken
from app.schemas.auth import UserResponse, UserRole, SubscriptionTier
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
)
from app.core.google_oauth import verify_google_id_token


class AuthService:
    """Authentication service handling all auth operations."""

    def __init__(self, db: Session):
        self.db = db

    def signup(self, email: str, password: str, name: str, role: str) -> Tuple[Optional[UserResponse], Optional[str]]:
        """
        Register a new user.

        Returns:
            Tuple of (UserResponse, error_message)
        """
        # Check if user exists
        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            return None, "Email already registered"

        # Create user
        user = User(
            email=email,
            password_hash=hash_password(password),
            name=name,
            role=role,
            tier=SubscriptionTier.FREE.value,
            auth_provider="email",
            is_active=True
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return UserResponse.from_orm_with_role(user), None

    def signin(self, email: str, password: str) -> Tuple[Optional[UserResponse], Optional[str]]:
        """
        Authenticate user with email/password.

        Returns:
            Tuple of (UserResponse, error_message)
        """
        user = self.db.query(User).filter(User.email == email).first()

        if not user:
            return None, "Invalid email or password"

        if not user.password_hash:
            return None, "Please use Google Sign In for this account"

        if not verify_password(password, user.password_hash):
            return None, "Invalid email or password"

        if not user.is_active:
            return None, "Account is deactivated"

        return UserResponse.from_orm_with_role(user), None

    def google_signin(self, google_token: str) -> Tuple[Optional[UserResponse], Optional[str]]:
        """
        Authenticate user with Google.

        Returns:
            Tuple of (UserResponse, error_message)
        """
        import asyncio
        # Verify Google token
        google_user = asyncio.get_event_loop().run_until_complete(
            verify_google_id_token(google_token)
        )

        if not google_user:
            return None, "Invalid Google token"

        email = google_user.get("email")
        google_id = google_user.get("google_id")
        name = google_user.get("name", email.split("@")[0])

        # Find or create user
        user = self.db.query(User).filter(User.email == email).first()

        if not user:
            # Create new user with Google
            user = User(
                email=email,
                password_hash=None,  # No password for Google users
                name=name,
                role=UserRole.GENERAL.value,
                tier=SubscriptionTier.FREE.value,
                auth_provider="google",
                google_id=google_id,
                is_active=True,
                is_verified=google_user.get("verified_email", False)
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)

        elif user.auth_provider != "google":
            return None, "Please use email/password Sign In for this account"

        elif not user.is_active:
            return None, "Account is deactivated"

        return UserResponse.from_orm_with_role(user), None

    def create_token_pair(self, user: User, user_agent: str = None, ip_address: str = None) -> dict:
        """
        Create access token and refresh token pair.

        Returns:
            Dict with access_token, refresh_token, expires_in
        """
        # Access token
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role}
        )

        # Refresh token
        refresh_token = create_refresh_token(data={"sub": user.id})
        refresh_token_jti = secrets.token_urlsafe(32)

        # Hash and store refresh token
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        refresh_token_db = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            token_jti=refresh_token_jti,
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        )

        self.db.add(refresh_token_db)
        self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # seconds
        }

    def refresh_tokens(self, refresh_token: str) -> Tuple[Optional[dict], Optional[str]]:
        """
        Refresh access token using refresh token (with rotation).

        Returns:
            Tuple of (token_dict, error_message)
        """
        # Decode token to get user_id
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None, "Invalid refresh token"

        user_id = payload.get("sub")
        if not user_id:
            return None, "Invalid token payload"

        # Find and validate stored token
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        stored_token = self.db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == user_id
        ).first()

        if not stored_token:
            return None, "Refresh token not found"

        if stored_token.is_revoked:
            return None, "Refresh token has been revoked"

        if stored_token.expires_at < datetime.utcnow():
            return None, "Refresh token has expired"

        # Get user
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            return None, "User not found or inactive"

        # Revoke old token
        stored_token.is_revoked = True

        # Create new token pair
        tokens = self.create_token_pair(
            user=user,
            user_agent=stored_token.user_agent,
            ip_address=stored_token.ip_address
        )

        self.db.commit()

        return tokens, None

    def forgot_password(self, email: str) -> Tuple[bool, Optional[str]]:
        """
        Request password reset.

        Returns:
            Tuple of (success, error_message)
        """
        user = self.db.query(User).filter(User.email == email).first()

        # Always return success to prevent email enumeration
        if not user or user.auth_provider != "email":
            return True, None

        # Generate reset token
        token = secrets.token_urlsafe(32)
        token_jti = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        # Store token
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            token_jti=token_jti,
            expires_at=datetime.utcnow() + timedelta(minutes=15)
        )

        self.db.add(reset_token)
        self.db.commit()

        # In production, send email with reset link
        # For now, we return the token in response (development only!)
        # print(f"Password reset token: {token}")
        # TODO: Send email

        return True, None

    def reset_password(self, token: str, new_password: str) -> Tuple[bool, Optional[str]]:
        """
        Reset password using reset token.

        Returns:
            Tuple of (success, error_message)
        """
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        stored_token = self.db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash
        ).first()

        if not stored_token:
            return False, "Invalid or expired reset token"

        if stored_token.is_used:
            return False, "Reset token has already been used"

        if stored_token.expires_at < datetime.utcnow():
            return False, "Reset token has expired"

        # Get user
        user = self.db.query(User).filter(User.id == stored_token.user_id).first()
        if not user:
            return False, "User not found"

        # Update password
        user.password_hash = hash_password(new_password)

        # Mark token as used
        stored_token.is_used = True

        # Revoke all refresh tokens (force re-login)
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user.id,
            RefreshToken.is_revoked == False
        ).update({"is_revoked": True})

        self.db.commit()

        return True, None

    def logout(self, user_id: str, refresh_token: Optional[str] = None) -> bool:
        """
        Logout user by revoking refresh token.

        Returns:
            True if successful
        """
        if refresh_token:
            token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
            self.db.query(RefreshToken).filter(
                RefreshToken.token_hash == token_hash,
                RefreshToken.user_id == user_id
            ).update({"is_revoked": True})

        self.db.commit()
        return True

    def revoke_all_tokens(self, user_id: str) -> bool:
        """
        Revoke all tokens for a user (for security).
        """
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False
        ).update({"is_revoked": True})

        self.db.commit()
        return True

    def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """
        Get user by ID.
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        return UserResponse.from_orm_with_role(user)