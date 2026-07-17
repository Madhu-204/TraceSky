import httpx
from typing import Optional, Dict, Any
from .security import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET


GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


async def verify_google_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Google ID token and extract user information.

    Args:
        id_token: The Google ID token from the frontend

    Returns:
        Dictionary with user info if valid, None if invalid
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "refresh_token": id_token,
                    "grant_type": "refresh_token"
                },
                timeout=10.0
            )

            if response.status_code != 200:
                return None

            user_info = response.json()

            return {
                "google_id": user_info.get("sub"),
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "picture": user_info.get("picture"),
                "verified_email": user_info.get("email_verified", False)
            }

    except Exception as e:
        print(f"Error verifying Google ID token: {e}")
        return None


async def verify_google_access_token(access_token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Google access token by calling the userinfo endpoint.

    Args:
        access_token: The Google access token from the frontend

    Returns:
        Dictionary with user info if valid, None if invalid
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GOOGLE_USER_INFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0
            )

            if response.status_code != 200:
                return None

            user_info = response.json()

            # Verify the audience matches our client ID
            aud = user_info.get("aud")
            if aud and aud != GOOGLE_CLIENT_ID:
                return None

            return {
                "google_id": user_info.get("sub"),
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "picture": user_info.get("picture"),
                "verified_email": user_info.get("email_verified", False)
            }

    except Exception as e:
        print(f"Error verifying Google access token: {e}")
        return None


async def verify_google_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Google token - tries both access token and ID token flows.

    Args:
        token: Either an access token or ID token from the frontend

    Returns:
        Dictionary with user info if valid, None if invalid
    """
    # Try access token first (most common from useGoogleLogin)
    result = await verify_google_access_token(token)
    if result:
        return result

    # Fall back to ID token verification
    return await verify_google_id_token(token)


async def get_google_oauth_url() -> str:
    """Get the Google OAuth authorization URL."""
    import urllib.parse

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": "http://localhost:5173/auth/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }

    return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"


async def exchange_code_for_tokens(code: str) -> Optional[Dict[str, Any]]:
    """
    Exchange authorization code for access and refresh tokens.

    Args:
        code: The authorization code from Google callback

    Returns:
        Dictionary with tokens if successful, None if failed
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": "http://localhost:5173/auth/callback"
                },
                timeout=10.0
            )

            if response.status_code != 200:
                return None

            return response.json()

    except Exception as e:
        print(f"Error exchanging code for tokens: {e}")
        return None


async def refresh_google_token(refresh_token: str) -> Optional[Dict[str, Any]]:
    """
    Refresh an expired Google access token.

    Args:
        refresh_token: The refresh token from initial OAuth flow

    Returns:
        Dictionary with new tokens if successful
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token"
                },
                timeout=10.0
            )

            if response.status_code != 200:
                return None

            return response.json()

    except Exception as e:
        print(f"Error refreshing Google token: {e}")
        return None