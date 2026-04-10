"""Authentication dependencies for FastAPI routes."""
from __future__ import annotations

from typing import Any

from fastapi import Header, HTTPException

from config import get_settings
from supabase_client import get_supabase_client


async def require_supabase_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    """Require a valid Supabase Bearer token and return normalized user claims."""
    cfg = get_settings()
    if not cfg.supabase_enabled:
        raise HTTPException(status_code=503, detail="Supabase auth is not configured on backend")

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(status_code=401, detail="Authorization must be in format: Bearer <token>")

    token = parts[1].strip()
    try:
        sb = get_supabase_client()
        resp = sb.auth.get_user(token)
    except Exception as exc:  # pragma: no cover - provider/runtime dependent
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {exc}") from exc

    user = getattr(resp, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "app_metadata": user.app_metadata,
        "user_metadata": user.user_metadata,
    }
