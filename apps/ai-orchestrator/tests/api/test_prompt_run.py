import json
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

from flowpilot_ai_orchestrator.main import app

fixtures_dir = Path(__file__).resolve().parents[1] / "fixtures"


def load_fixture(name: str) -> dict[str, Any]:
    return json.loads((fixtures_dir / name).read_text(encoding="utf-8"))


def test_prompt_run_returns_deterministic_response() -> None:
    client = TestClient(app)

    response = client.post(
        "/v1/prompts/run",
        json=load_fixture("prompt_run_request.json"),
    )

    assert response.status_code == 200
    assert response.json() == load_fixture("prompt_run_response.json")
