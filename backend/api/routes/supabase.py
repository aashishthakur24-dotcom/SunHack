"""Supabase integration routes for backend auth bridging."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import get_settings
from supabase_client import get_supabase_client

router = APIRouter()


class VerifyTokenRequest(BaseModel):
    access_token: str


@router.get("/status")
async def supabase_status():
    cfg = get_settings()
    project_ref = ""
    if cfg.supabase_url and "//" in cfg.supabase_url:
        host = cfg.supabase_url.split("//", 1)[1]
        project_ref = host.split(".", 1)[0]

    return {
        "enabled": cfg.supabase_enabled,
        "project_ref": project_ref,
        "has_anon_key": bool(cfg.supabase_anon_key),
        "has_service_role_key": bool(cfg.supabase_service_role_key),
        "redirect_url": cfg.supabase_redirect_url,
    }


@router.post("/verify-token")
async def verify_supabase_token(body: VerifyTokenRequest):
    """Verifies a Supabase access token and returns authenticated user info."""
    try:
        sb = get_supabase_client()
        resp = sb.auth.get_user(body.access_token)
    except Exception as exc:  # pragma: no cover - provider/runtime dependent
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {exc}") from exc

    user = getattr(resp, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "app_metadata": user.app_metadata,
            "user_metadata": user.user_metadata,
        },
    }
