import os
import json
import time
import threading
from typing import Optional, Any

from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

_redis_client = None
_redis_available = False

_in_memory_cache: dict[str, tuple[Any, float]] = {}
_in_memory_lock = threading.Lock()


def _get_redis_client():
    global _redis_client, _redis_available
    if _redis_client is None:
        try:
            import redis
            _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            _redis_client.ping()
            _redis_available = True
        except Exception:
            _redis_available = False
            _redis_client = None
    return _redis_client


def get_cache(key: str) -> Optional[Any]:
    if _get_redis_client() and _redis_available:
        try:
            value = _redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Redis get error, falling back to memory: {e}")
    with _in_memory_lock:
        if key in _in_memory_cache:
            val, expiry = _in_memory_cache[key]
            if expiry > time.time():
                return val
    return None


def get_cache_stale(key: str) -> Optional[Any]:
    if _get_redis_client() and _redis_available:
        try:
            value = _redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Redis get stale error, falling back to memory: {e}")
    with _in_memory_lock:
        if key in _in_memory_cache:
            return _in_memory_cache[key][0]
    return None


def set_cache(key: str, value: Any, expire: int = 3600) -> bool:
    if _get_redis_client() and _redis_available:
        try:
            _redis_client.setex(key, expire, json.dumps(value))
            return True
        except Exception as e:
            print(f"Redis set error, falling back to memory: {e}")
    with _in_memory_lock:
        _in_memory_cache[key] = (value, time.time() + expire)
    return True


def delete_cache(key: str) -> bool:
    if _get_redis_client() and _redis_available:
        try:
            _redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Redis delete error: {e}")
    with _in_memory_lock:
        _in_memory_cache.pop(key, None)
    return True


def clear_cache(pattern: str = "*") -> bool:
    if _get_redis_client() and _redis_available:
        try:
            keys = _redis_client.keys(pattern)
            if keys:
                _redis_client.delete(*keys)
            return True
        except Exception as e:
            print(f"Redis clear error, falling back to memory: {e}")
    with _in_memory_lock:
        _in_memory_cache.clear()
    return True