from typing import List, Sequence

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import (
    SignUpRequest, SignUpResponse, SignInRequest, SignInResponse,
    GoogleSignInRequest, ForgotPasswordRequest, ResetPasswordRequest,
    RefreshTokenRequest, TokenRefreshResponse, LogoutResponse,
    ForgotPasswordResponse, MessageResponse, UserResponse, ErrorResponse,
    ChangePasswordRequest, UpdateProfileRequest
)
from app.services.auth_service import AuthService
from app.core.security import decode_token, COOKIE_NAME, COOKIE_SECURE, COOKIE_HTTPONLY, COOKIE_SAMESITE, COOKIE_MAX_AGE

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Get current authenticated user from cookie.
    """
    # Get token from cookie
    token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # Decode token
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    # Get user
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


@router.post("/signup", response_model=SignUpResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignUpRequest, http_request: Request, response: Response, db: Session = Depends(get_db)):
    """Register a new user account."""
    auth_service = AuthService(db)

    user, error = auth_service.signup(
        email=body.email,
        password=body.password,
        name=body.name
    )

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    # Create token pair
    from app.models.user import User
    db_user = db.query(User).filter(User.email == body.email).first()
    tokens = auth_service.create_token_pair(
        db_user,
        user_agent=http_request.headers.get("user-agent"),
        ip_address=http_request.client.host if http_request.client else None
    )

    # Set cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=tokens["access_token"],
        httponly=COOKIE_HTTPONLY,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=COOKIE_MAX_AGE,
        path="/"
    )

    return SignUpResponse(user=user, refresh_token=tokens["refresh_token"])


@router.post("/signin", response_model=SignInResponse)
def signin(body: SignInRequest, http_request: Request, response: Response, db: Session = Depends(get_db)):
    """Sign in with email and password."""
    auth_service = AuthService(db)

    user, error = auth_service.signin(body.email, body.password)

    if error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)

    # Create token pair
    from app.models.user import User
    db_user = db.query(User).filter(User.email == body.email).first()
    tokens = auth_service.create_token_pair(
        db_user,
        user_agent=http_request.headers.get("user-agent"),
        ip_address=http_request.client.host if http_request.client else None
    )

    # Set cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=tokens["access_token"],
        httponly=COOKIE_HTTPONLY,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=COOKIE_MAX_AGE,
        path="/"
    )

    return SignInResponse(user=user, refresh_token=tokens["refresh_token"], expires_in=tokens["expires_in"])


@router.post("/google", response_model=SignInResponse)
async def google_signin(body: GoogleSignInRequest, http_request: Request, response: Response, db: Session = Depends(get_db)):
    """Sign in with Google OAuth."""
    auth_service = AuthService(db)

    user, error = await auth_service.google_signin(body.google_token)

    if error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)

    # Create token pair
    from app.models.user import User
    db_user = db.query(User).filter(User.email == user.email).first()
    tokens = auth_service.create_token_pair(
        db_user,
        user_agent=http_request.headers.get("user-agent"),
        ip_address=http_request.client.host if http_request.client else None
    )

    # Set cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=tokens["access_token"],
        httponly=COOKIE_HTTPONLY,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=COOKIE_MAX_AGE,
        path="/"
    )

    return SignInResponse(user=user, refresh_token=tokens["refresh_token"], expires_in=tokens["expires_in"])


@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh_token(request: RefreshTokenRequest, response: Response, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    auth_service = AuthService(db)

    tokens, error = auth_service.refresh_tokens(request.refresh_token)

    if error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)

    # Set new cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=tokens["access_token"],
        httponly=COOKIE_HTTPONLY,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=COOKIE_MAX_AGE,
        path="/"
    )

    return TokenRefreshResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        expires_in=tokens["expires_in"]
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request password reset."""
    auth_service = AuthService(db)

    # Always return success to prevent email enumeration
    auth_service.forgot_password(request.email)

    return ForgotPasswordResponse(
        message="If the email exists, a reset link has been sent"
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password with token."""
    auth_service = AuthService(db)

    success, error = auth_service.reset_password(request.token, request.new_password)

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    return MessageResponse(message="Password has been reset successfully")


@router.post("/logout", response_model=LogoutResponse)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Log out current user."""
    auth_service = AuthService(db)

    # Get refresh token from cookie if available
    refresh_token = request.cookies.get("refresh_token")

    # Revoke tokens
    auth_service.logout(current_user.id, refresh_token)

    # Clear cookie
    response.delete_cookie(key=COOKIE_NAME, path="/")
    response.delete_cookie(key="refresh_token", path="/")

    return LogoutResponse()


@router.put("/profile", response_model=UserResponse)
def update_profile(
    body: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Update current user's profile."""
    auth_service = AuthService(db)

    user, error = auth_service.update_profile(
        user_id=current_user.id,
        name=body.name,
        location_default=body.location_default,
        theme_accent=body.theme_accent,
    )

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    return user


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Change password for authenticated user."""
    auth_service = AuthService(db)

    success, error = auth_service.change_password(
        user_id=current_user.id,
        old_password=body.old_password,
        new_password=body.new_password
    )

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    return MessageResponse(message="Password changed successfully. Please sign in again.")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get current authenticated user."""
    return current_user