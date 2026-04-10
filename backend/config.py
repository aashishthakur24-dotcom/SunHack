"""
DecisionDNA — Application Configuration
Centralized settings via pydantic-settings.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── App ────────────────────────────────────────────────
    app_env: str = "development"
    app_port: int = 8080
    cors_origins: str = "http://localhost:5173,http://localhost:8081,http://localhost:3000"
    secret_key: str = "change-me-in-production"

    # ── Supabase ───────────────────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_redirect_url: str = "http://localhost:5173/dashboard"

    # ── OpenAI ─────────────────────────────────────────────
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-small"

    # ── Neo4j ──────────────────────────────────────────────
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = "decisiondna123"

    # ── ChromaDB ───────────────────────────────────────────
    chroma_host: str = "localhost"
    chroma_port: int = 8000
    chroma_collection_decisions: str = "decisions"
    chroma_collection_sources: str = "sources"
    chroma_collection_entities: str = "entities"

    # ── Redis ──────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # ── Slack ──────────────────────────────────────────────
    slack_bot_token: str = ""
    slack_app_token: str = ""
    slack_signing_secret: str = ""

    # ── Google ─────────────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8080/auth/google/callback"
    google_scopes: str = "https://www.googleapis.com/auth/gmail.readonly"

    # ── Agent Tuning ───────────────────────────────────────
    ingestion_chunk_size: int = 512
    ingestion_chunk_overlap: int = 64
    conflict_threshold: float = 0.72
    confidence_min: float = 0.60
    graph_community_resolution: float = 1.0
    max_concurrent_agents: int = 4

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def supabase_enabled(self) -> bool:
        return bool(self.supabase_url and (self.supabase_service_role_key or self.supabase_anon_key))


@lru_cache()
def get_settings() -> Settings:
    return Settings()
