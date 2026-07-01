from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum


# ==================== Enums ====================
class UserRole(str, Enum):
    FARMER = "Farmer"
    TRAVELER = "Traveler"
    OFFICER = "Officer"
    GENERAL = "General"


class SubscriptionTier(str, Enum):
    FREE = "Free Account"
    PREMIUM = "Premium Intelligence"
    ENTERPRISE = "Enterprise Node"


# ==================== Request Schemas ====================


class SignUpRequest(BaseModel):
    """Request schema for user registration."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.GENERAL


class SignInRequest(BaseModel):
    """Request schema for user login."""
    email: EmailStr
    password: str
    role: Optional[UserRole] = None  # Frontend sends role on login


class GoogleSignInRequest(BaseModel):
    """Request schema for Google OAuth login."""
    google_token: str = Field(..., min_length=10)
    role: Optional[UserRole] = None  # Frontend sends role


class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request schema for password reset."""
    token: str
    new_password: str = Field(..., min_length=8)


class RefreshTokenRequest(BaseModel):
    """Request schema for token refresh."""
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Request schema for changing password when logged in."""
    old_password: str
    new_password: str = Field(..., min_length=8)


# ==================== Response Schemas ====================


class UserResponse(BaseModel):
    """Response schema for user data."""
    id: str
    name: str
    email: str
    role: UserRole
    tier: SubscriptionTier
    location_default: Optional[str] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_role(cls, user):
        """Create response from User ORM object."""
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            role=UserRole(user.role),
            tier=SubscriptionTier(user.tier),
            location_default=user.location_default
        )


class TokenResponse(BaseModel):
    """Response schema for token pair."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class SignInResponse(BaseModel):
    """Response schema for sign in."""
    user: UserResponse
    refresh_token: str
    expires_in: int = 900  # 15 minutes


class SignUpResponse(BaseModel):
    """Response schema for sign up."""
    message: str = "Account created successfully"
    user: UserResponse
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """Response schema for token refresh."""
    access_token: str
    refresh_token: str
    expires_in: int = 900


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


class LogoutResponse(BaseModel):
    """Response schema for logout."""
    message: str = "Logged out successfully"


class ErrorResponse(BaseModel):
    """Error response."""
    detail: str