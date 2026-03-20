"""
Supabase client helper for storage and database operations.
"""

from __future__ import annotations

import logging
import mimetypes
import os
from typing import Any, Optional

from supabase import create_client, Client
from config import settings

logger = logging.getLogger(__name__)

_supabase: Optional[Client] = None


def is_production_runtime() -> bool:
    """Return True when running in production/serverless mode."""
    return settings.app_env == "production" or bool(os.getenv("VERCEL"))


def ensure_storage_config() -> None:
    """Validate that Supabase Storage is configured correctly."""
    missing = []
    if not settings.supabase_url:
        missing.append("SUPABASE_URL")
    if not settings.supabase_key:
        missing.append("SUPABASE_KEY")
    if not settings.supabase_storage_bucket:
        missing.append("SUPABASE_STORAGE_BUCKET")
    if missing:
        raise RuntimeError(
            "Supabase Storage not configured for production finalize. Missing: "
            + ", ".join(missing)
        )

    if settings.supabase_url.startswith("postgres"):
        raise RuntimeError(
            "SUPABASE_URL must be the Supabase project URL, not the database URL"
        )
    if ".supabase.co" not in settings.supabase_url:
        raise RuntimeError(
            "SUPABASE_URL does not look like a Supabase project URL"
        )


def _normalize_public_url(url_res: Any) -> str:
    """Normalize Supabase SDK public URL responses to a plain string."""
    if isinstance(url_res, str):
        return url_res
    if isinstance(url_res, dict):
        data = url_res.get("data")
        if isinstance(data, dict) and data.get("publicUrl"):
            return data["publicUrl"]
        if url_res.get("publicUrl"):
            return url_res["publicUrl"]
    public_url = getattr(url_res, "public_url", None)
    if public_url:
        return public_url
    data = getattr(url_res, "data", None)
    if isinstance(data, dict) and data.get("publicUrl"):
        return data["publicUrl"]
    raise RuntimeError(f"Unexpected Supabase public URL response: {url_res!r}")


def verify_storage_object(file_path: str, bucket: str) -> bool:
    """Check whether an uploaded object is visible in the bucket."""
    supabase = get_supabase()
    folder, filename = file_path.rsplit("/", 1) if "/" in file_path else ("", file_path)
    results = supabase.storage.from_(bucket).list(folder or "")
    for item in results or []:
        if item.get("name") == filename:
            return True
    return False


def check_storage_bucket_access(bucket: str) -> bool:
    """Check that the bucket can be listed with current credentials."""
    try:
        supabase = get_supabase()
        supabase.storage.from_(bucket).list("")
        return True
    except Exception as e:
        message = str(e)
        if "Invalid API key" in message:
            raise RuntimeError(
                "Supabase Storage authentication failed: invalid SUPABASE_KEY. "
                "Use the Supabase service-role key, not the anon key."
            ) from e
        raise RuntimeError(
            f"Supabase Storage bucket access failed for '{bucket}': {message}"
        ) from e

def get_supabase() -> Client:
    """Return the Supabase client."""
    global _supabase
    if _supabase is not None:
        return _supabase
    
    if not settings.supabase_url or not settings.supabase_key:
        logger.warning("Supabase credentials missing")
        raise ValueError("Supabase credentials missing")
        
    _supabase = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase

def upload_contract_file(file_path: str, file_bytes: bytes | bytearray, bucket: str = "contracts") -> str:
    """
    Upload a file to Supabase Storage and return the public URL.
    """
    ensure_storage_config()
    supabase = get_supabase()
    if isinstance(file_bytes, bytearray):
        file_bytes = bytes(file_bytes)

    content_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
    logger.info(
        "Supabase upload starting: bucket=%s path=%s content_type=%s bytes=%d",
        bucket,
        file_path,
        content_type,
        len(file_bytes),
    )

    try:
        supabase.storage.from_(bucket).upload(
            path=file_path,
            file=file_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "true",
            },
        )
    except Exception as e:
        message = str(e)
        if "Invalid API key" in message:
            raise RuntimeError(
                "Supabase Storage authentication failed: invalid SUPABASE_KEY. "
                "Use the Supabase service-role key, not the anon key."
            ) from e
        raise RuntimeError(
            f"Supabase upload failed for {bucket}/{file_path}: {message}"
        ) from e
    logger.info("Supabase upload completed: bucket=%s path=%s", bucket, file_path)

    url_res = supabase.storage.from_(bucket).get_public_url(file_path)
    public_url = _normalize_public_url(url_res)
    logger.info("Supabase public URL generated: bucket=%s path=%s url=%s", bucket, file_path, public_url)

    verified = verify_storage_object(file_path, bucket)
    logger.info(
        "Supabase verification %s: bucket=%s path=%s",
        "passed" if verified else "failed",
        bucket,
        file_path,
    )
    if not verified:
        raise RuntimeError(
            f"Supabase upload verification failed for {bucket}/{file_path}"
        )

    return public_url


def download_storage_file(file_path: str, bucket: str = "contracts") -> bytes:
    """Download a file from Supabase Storage and return its bytes."""
    ensure_storage_config()
    supabase = get_supabase()
    try:
        data = supabase.storage.from_(bucket).download(file_path)
    except Exception as e:
        message = str(e)
        if "Invalid API key" in message:
            raise RuntimeError(
                "Supabase Storage authentication failed: invalid SUPABASE_KEY. "
                "Use the Supabase service-role key, not the anon key."
            ) from e
        raise RuntimeError(
            f"Supabase download failed for {bucket}/{file_path}: {message}"
        ) from e

    if isinstance(data, bytes):
        return data
    if hasattr(data, "read"):
        return data.read()
    raise RuntimeError(f"Unexpected Supabase download response for {bucket}/{file_path}: {type(data)!r}")


def list_contract_history(bucket: str = "contracts") -> list[dict[str, Any]]:
    """List grouped contract artifacts from Supabase Storage."""
    ensure_storage_config()
    supabase = get_supabase()
    results = supabase.storage.from_(bucket).list(
        "contracts",
        {"limit": 200, "sortBy": {"column": "created_at", "order": "desc"}},
    )

    grouped: dict[str, dict[str, Any]] = {}
    for item in results or []:
        name = item.get("name", "")
        if not name.startswith("CTR-"):
            continue

        contract_id = name.split(".")[0].replace("_deal_sheet", "")
        created_at = item.get("created_at") or item.get("updated_at") or ""
        object_path = f"contracts/{name}"
        public_url = _normalize_public_url(
            supabase.storage.from_(bucket).get_public_url(object_path)
        )

        existing = grouped.get(contract_id) or {
            "id": contract_id,
            "contract_id": contract_id,
            "base_name": contract_id,
            "created_at": created_at,
            "pdf_url": None,
            "docx_url": None,
            "has_deal_sheet": False,
        }

        if created_at and created_at > existing["created_at"]:
            existing["created_at"] = created_at
        if name.endswith(".pdf"):
            existing["pdf_url"] = public_url
        elif name.endswith(".docx"):
            existing["docx_url"] = public_url
        elif name.endswith("_deal_sheet.json"):
            existing["has_deal_sheet"] = True

        grouped[contract_id] = existing

    return sorted(grouped.values(), key=lambda item: item["created_at"], reverse=True)
