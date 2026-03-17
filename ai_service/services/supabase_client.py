"""
Supabase client helper for storage and database operations.
"""

from __future__ import annotations

import logging
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
        
        # Ensure bucket exists (or just try to upload)
        filename = file_path.split("/")[-1]
        
        # Supabase storage upload
        res = supabase.storage.from_(bucket).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": "application/pdf" if filename.endswith(".pdf") else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
        )
        
        # Get public URL
        url_res = supabase.storage.from_(bucket).get_public_url(filename)
        return url_res
    except Exception as e:
        logger.error("Failed to upload to Supabase: %s", str(e))
        return None
