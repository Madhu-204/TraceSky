import os
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# ==================== JWT Configuration ====================
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

# Token expiration times
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # 15 minutes - short-lived
REFRESH_TOKEN_EXPIRE_DAYS = 7  # 7 days - for rotation

# ==================== Cookie Configuration ====================
COOKIE_NAME = "tracesky_token"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true" if ENVIRONMENT == "production" else "false").lower() == "true"
COOKIE_HTTPONLY = True  # Cannot be accessed via JavaScript
COOKIE_SAMESITE = "none" if ENVIRONMENT == "production" else "lax"
COOKIE_MAX_AGE = 60 * ACCESS_TOKEN_EXPIRE_MINUTES  # 15 minutes = 900 seconds

# ==================== Password Configuration ====================
PASSWORD_MIN_LENGTH = 8
PASSWORD_REGEX = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==================== CORS Configuration ====================
_frontend_url = os.getenv("FRONTEND_URL", "")
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]
if _frontend_url:
    CORS_ORIGINS.append(_frontend_url)

# ==================== Google OAuth Configuration ====================
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", f"{_frontend_url}/auth/callback" if _frontend_url else "http://localhost:5173/auth/callback")

# ==================== Helper Functions ====================


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})

    # Use base64 encoded random bytes for refresh token
    import secrets
    refresh_token = secrets.token_urlsafe(32)
    to_encode.update({"jti": refresh_token})

    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def extract_token_payload(token: str) -> Optional[dict]:
    """Extract payload from token without verification (for preview)."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM], options={"verify_signature": False})
        return payload
    except JWTError:
        return None


def is_token_expired(token: str) -> bool:
    """Check if a token is expired."""
    payload = extract_token_payload(token)
    if not payload:
        return True

    exp = payload.get("exp")
    if not exp:
        return True

    return datetime.utcnow() > datetime.fromtimestamp(exp)