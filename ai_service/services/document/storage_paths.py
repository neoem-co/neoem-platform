"""
Helpers for writable storage paths across local and serverless environments.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

from config import settings


def get_contracts_dir() -> Path:
    """
    Return a writable directory for generated contract artifacts.

    Local dev keeps using ./data/contracts.
    Serverless environments use /tmp because the deployment bundle is read-only.
    """
    if settings.app_env == "production" or os.getenv("VERCEL"):
        return Path(tempfile.gettempdir()) / "neoem_ai" / "contracts"
    return Path("./data/contracts")


def get_risk_results_dir() -> Path:
    """
    Return a writable directory for stored risk-analysis artifacts.

    Local dev keeps using ./data/contracts/risk-results.
    Serverless environments use /tmp because the deployment bundle is read-only.
    """
    return get_contracts_dir() / "risk-results"

