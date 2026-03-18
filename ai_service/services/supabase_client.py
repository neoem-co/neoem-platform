"""
Supabase client helper for storage and database operations.
"""

from __future__ import annotations

import logging
import mimetypes
from typing import Optional

from supabase import create_client, Client
from config import settings

logger = logging.getLogger(__name__)

_supabase: Optional[Client] = None

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

def upload_contract_file(file_path: str, file_bytes: bytes, bucket: str = "contracts") -> Optional[str]:
    """
    Upload a file to Supabase Storage and return the public URL.
    """
    try:
        supabase = get_supabase()

        content_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"

        supabase.storage.from_(bucket).upload(
            path=file_path,
            file=file_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "true",
            },
        )

        # Get public URL
        url_res = supabase.storage.from_(bucket).get_public_url(file_path)
        return url_res
    except Exception as e:
        logger.error("Failed to upload to Supabase: %s", str(e))
        return None
