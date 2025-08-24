import os
import time
import asyncio
from typing import Any, Dict, List, Tuple
import httpx

# In-memory cache and rate limiter (process-local)
_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
_RATE: Dict[str, List[float]] = {}

# Env
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
NEWSAPI_ENDPOINT = os.getenv("NEWSAPI_ENDPOINT", "https://newsapi.org/v2/everything")
TOOL_CACHE_TTL = int(os.getenv("TOOL_CACHE_TTL", "600"))
TOOL_TIMEOUT_SECONDS = float(os.getenv("TOOL_TIMEOUT_SECONDS", "10"))


class NewsToolError(Exception):
    pass


def _sanitize_topic(value: str) -> str:
    value = (value or "").strip()
    if not value:
        raise NewsToolError("topic is required")
    if len(value) > 200:
        raise NewsToolError("topic too long (max 200)")
    # Basic sanitization: collapse spaces
    return " ".join(value.split())


def _validate_language(lang: str) -> str:
    lang = (lang or "en").strip().lower()
    if not lang:
        lang = "en"
    # Let NewsAPI validate language code further; keep simple here
    return lang


def _validate_page_size(n: Any) -> int:
    try:
        num = int(n)
    except Exception:
        num = 5
    if num < 1:
        num = 1
    if num > 10:
        num = 10
    return num


def _cache_key(topic: str, language: str, page_size: int) -> str:
    return f"news::{topic.lower()}::{language}::{page_size}"


def _now() -> float:
    return time.time()


def _rate_key(user_id: str) -> str:
    return f"news::{user_id}"


def check_rate_limit(user_id: str, limit: int = 5, window_seconds: int = 60) -> None:
    """Raises NewsToolError if limit exceeded."""
    if not user_id:
        # If no user id (unlikely), don't rate limit
        return
    key = _rate_key(user_id)
    ts_list = _RATE.get(key, [])
    now = _now()
    # prune
    ts_list = [t for t in ts_list if now - t < window_seconds]
    if len(ts_list) >= limit:
        raise NewsToolError("Rate limit exceeded: try again later")
    ts_list.append(now)
    _RATE[key] = ts_list


async def fetch_news(params: Dict[str, Any]) -> Dict[str, Any]:
    if not NEWSAPI_KEY:
        raise NewsToolError("NEWSAPI_KEY not configured")

    topic = _sanitize_topic(str(params.get("topic", "")))
    language = _validate_language(str(params.get("language", "en")))
    page_size = _validate_page_size(params.get("pageSize", 5))

    key = _cache_key(topic, language, page_size)
    now = _now()
    cached = _CACHE.get(key)
    if cached and now < cached[0]:
        data = cached[1]
        return {
            "provider": "newsapi",
            "query": topic,
            "articles": data.get("articles", []),
            "cached": True,
            "ttl_remaining": int(cached[0] - now),
        }

    # Build request
    q_params = {
        "q": topic,
        "language": language,
        "pageSize": str(page_size),
        "apiKey": NEWSAPI_KEY,
        # You could add sortBy=publishedAt
    }

    try:
        async with httpx.AsyncClient(timeout=TOOL_TIMEOUT_SECONDS) as client:
            resp = await client.get(NEWSAPI_ENDPOINT, params=q_params)
            status = resp.status_code
            if status != 200:
                raise NewsToolError(f"News provider error: {status}")
            payload = resp.json()
    except asyncio.TimeoutError:
        raise NewsToolError("News request timed out")
    except httpx.RequestError as e:
        raise NewsToolError(f"Network error: {str(e)}")

    # Normalize
    articles = []
    for item in payload.get("articles", [])[:page_size]:
        title = (item.get("title") or "").strip()
        url = (item.get("url") or "").strip()
        source = (item.get("source", {}) or {}).get("name") or ""
        published_at = (item.get("publishedAt") or "").strip()
        content = item.get("content") or item.get("description") or ""
        snippet = (content or "")[:200]
        articles.append({
            "title": title,
            "source": source,
            "publishedAt": published_at,
            "url": url,
            "snippet": snippet,
        })

    result = {
        "provider": "newsapi",
        "query": topic,
        "articles": articles,
        "cached": False,
        "ttl_remaining": TOOL_CACHE_TTL,
    }

    # Cache
    _CACHE[key] = (now + TOOL_CACHE_TTL, result)
    return result
