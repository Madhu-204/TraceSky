import httpx
from typing import Optional, Dict, Any
from .security import GOOGLE_CLIENT_ID


GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
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
        # First, get Google's public keys from their discovery document
        async with httpx.AsyncClient() as client:
            # Verify the token by calling Google's token info endpoint
            response = await client.post(
                "https://oauth2.googleapis.com/tokeninfo",
                data={"id_token": id_token},
                timeout=10.0
            )

            if response.status_code != 200:
                return None

            user_info = response.json()

            # Verify the audience matches our client ID
            aud = user_info.get("aud")
            if aud != GOOGLE_CLIENT_ID:
                # For development, we might not have set up client ID yet
                # Allow if it's a valid Google token
                if not GOOGLE_CLIENT_ID:
                    pass
                else:
                    return None

            return {
                "google_id": user_info.get("sub"),
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "picture": user_info.get("picture"),
                "verified_email": user_info.get("email_verified", False)
            }

    except Exception as e:
        print(f"Error verifying Google token: {e}")
        return None


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
                    "client_secret": "dummy",  # Will be overridden in production
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
                    "client_secret": "dummy",
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


# For simpler implementation - we can use Firebase-style verification
# which doesn't require client_secret
async def verify_google_token_simple(id_token: str, expected_aud: str = None) -> Optional[Dict[str, Any]]:
    """
    Simple Google token verification - works with Firebase IDs too.

    This is a simplified version that verifies the token structure
    and optionally checks against Google's tokeninfo endpoint.
    """
    if not id_token or len(id_token) < 10:
        return None

    # For development - just check if it looks like a valid token
    # In production, you'd want to verify with Google's API
    parts = id_token.split('.')
    if len(parts) != 3:
        return None

    # Try to verify via Google's tokeninfo
    return await verify_google_id_token(id_token)