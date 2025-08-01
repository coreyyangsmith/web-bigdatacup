"""Simple integration tests for miscellaneous API endpoints.

These tests spin up the FastAPI application using TestClient and hit a
few of the publicly-exposed endpoints to make sure they respond with the
expected payloads and HTTP status codes.

NOTE: The application settings require an ``OPENAI_API_KEY`` environment
variable.  We inject a dummy value here before importing the app so that
the settings model validates successfully.  No external calls are made
by these tests, therefore the key does not need to be valid.
"""
from __future__ import annotations

import os
from typing import Any

from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Test setup
# ---------------------------------------------------------------------------
# Ensure required env vars exist _before_ the application is imported
os.environ.setdefault("OPENAI_API_KEY", "test-key")

# Import the FastAPI app _after_ environment variables are in place
from src.main import app  # noqa: E402  pylint: disable=wrong-import-position

client = TestClient(app)


# ---------------------------------------------------------------------------
# Tests – root & health-check style endpoints
# ---------------------------------------------------------------------------

def test_root_endpoint() -> None:
    """GET / should return a welcome message."""
    resp = client.get("/")
    assert resp.status_code == 200
    data: dict[str, Any] = resp.json()
    assert "message" in data
    # Basic sanity check – content should reference "Welcome"
    assert "Welcome" in data["message"]


def test_ping_endpoint() -> None:
    """GET /ping should return a pong response."""
    resp = client.get("/ping")
    assert resp.status_code == 200
    assert resp.json() == {"ping": "pong"}


def test_api_test_endpoint() -> None:
    """GET /api/test should respond with status ok."""
    resp = client.get("/api/test")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
