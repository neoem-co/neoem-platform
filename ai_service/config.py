"""
Application configuration — loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # ── Typhoon LLM ──────────────────────────────────
    typhoon_api_key: str = Field(default="", alias="TYPHOON_API_KEY")
    typhoon_base_url: str = Field(
        default="https://api.opentyphoon.ai/v1", alias="TYPHOON_BASE_URL"
    )
    typhoon_model: str = Field(
        default="typhoon-v2.5-30b-a3b-instruct", alias="TYPHOON_MODEL"
    )

    # ── Gemini LLM ──────────────────────────────────
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    gemini_model: str = Field(
        default="gemini-1.5-flash", alias="GEMINI_MODEL"
    )
    gemini_embedding_model: str = Field(
        default="gemini-embedding-001", alias="GEMINI_EMBEDDING_MODEL"
    )

    # ── iApp Technology ──────────────────────────────
    iapp_api_key: str = Field(default="", alias="IAPP_API_KEY")
    iapp_ocr_url: str = Field(
        default="https://api.iapp.co.th/v3/store/ocr/document/ocr",
        alias="IAPP_OCR_URL",
    )
    iapp_ocr_layout_url: str = Field(
        default="https://api.iapp.co.th/v3/store/ocr/document/layout",
        alias="IAPP_OCR_LAYOUT_URL",
    )
    iapp_thanoy_url: str = Field(
        default="https://api.iapp.co.th/v3/store/llm/thanoy-legal-ai",
        alias="IAPP_THANOY_URL",
    )

    # ── Vector Store ─────────────────────────────────
    vector_store_provider: str = Field(default="chromadb", alias="VECTOR_STORE_PROVIDER")
    chroma_persist_dir: str = Field(
        default="./data/chroma_db", alias="CHROMA_PERSIST_DIR"
    )

    # ── Supabase ─────────────────────────────────────
    supabase_url: str = Field(default="", alias="SUPABASE_URL")
    supabase_key: str = Field(default="", alias="SUPABASE_KEY")
    # For pgvector: postgresql://postgres.ID:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
    supabase_db_url: str = Field(default="", alias="SUPABASE_DB_URL")

    # ── Application ──────────────────────────────────
    app_env: str = Field(default="development", alias="APP_ENV")
    app_port: int = Field(default=8000, alias="APP_PORT")
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:3001,https://*.vercel.app", 
        alias="CORS_ORIGINS"
    )
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    ocr_char_threshold: int = Field(default=50, alias="OCR_CHAR_THRESHOLD")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
