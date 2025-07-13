"""Tests for the ``/api/session`` endpoint."""

import sys
import os
from fastapi.testclient import TestClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app


def test_create_session_returns_id():
    client = TestClient(app)
    resp = client.post("/api/session")
    assert resp.status_code == 200
    data = resp.json()
    assert "session_id" in data
    assert isinstance(data["session_id"], str)

