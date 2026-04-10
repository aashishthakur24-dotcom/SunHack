"""Supabase client helpers for backend routes and services."""
from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from config import get_settings


def _build_client(key: str) -> Client:
    cfg = get_settings()
    if not cfg.supabase_url or not key:
        raise RuntimeError("Supabase is not configured. Set SUPABASE_URL and a key.")
    return create_client(cfg.supabase_url, key)


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Default backend client (prefers service role, falls back to anon key)."""
    cfg = get_settings()
    key = cfg.supabase_service_role_key or cfg.supabase_anon_key
    return _build_client(key)


@lru_cache(maxsize=1)
def get_supabase_admin_client() -> Client:
    """Admin client requiring service role key."""
    cfg = get_settings()
    if not cfg.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for admin operations.")
    return _build_client(cfg.supabase_service_role_key)
