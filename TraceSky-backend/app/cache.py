import redis
from dotenv import load_dotenv
import os
import json
from typing import Optional, Any

load_dotenv()

# Redis URL
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Create Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)


def get_cache(key: str) -> Optional[Any]:
    """Get value from cache."""
    try:
        value = redis_client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        print(f"Cache get error: {e}")
        return None


def set_cache(key: str, value: Any, expire: int = 3600) -> bool:
    """Set value in cache with expiration in seconds."""
    try:
        redis_client.setex(key, expire, json.dumps(value))
        return True
    except Exception as e:
        print(f"Cache set error: {e}")
        return False


def delete_cache(key: str) -> bool:
    """Delete key from cache."""
    try:
        redis_client.delete(key)
        return True
    except Exception as e:
        print(f"Cache delete error: {e}")
        return False


def clear_cache(pattern: str = "*") -> bool:
    """Clear cache by pattern."""
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
        return True
    except Exception as e:
        print(f"Cache clear error: {e}")
        return False