import copy
import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from flowpilot_ai_orchestrator.main import app

fixtures_dir = Path(__file__).resolve().parents[1] / "fixtures"


def load_prompt_request() -> dict[str, Any]:
    return json.loads((fixtures_dir / "prompt_run_request.json").read_text(encoding="utf-8"))


def without_context(payload: dict[str, Any]) -> None:
    payload.pop("context")


def without_prompt(payload: dict[str, Any]) -> None:
    del payload["config"]["prompt"]


def with_empty_prompt(payload: dict[str, Any]) -> None:
    payload["config"]["prompt"] = ""


def with_temperature_below_range(payload: dict[str, Any]) -> None:
    payload["config"]["temperature"] = -0.1


def with_temperature_above_range(payload: dict[str, Any]) -> None:
    payload["config"]["temperature"] = 2.1


def with_extra_root_field(payload: dict[str, Any]) -> None:
    payload["unexpected"] = True


def with_extra_config_field(payload: dict[str, Any]) -> None:
    payload["config"]["maxTokens"] = 128


@pytest.mark.parametrize(
    "mutate_payload",
    [
        without_context,
        without_prompt,
        with_empty_prompt,
        with_temperature_below_range,
        with_temperature_above_range,
        with_extra_root_field,
        with_extra_config_field,
    ],
)
def test_prompt_run_rejects_invalid_payload(
    mutate_payload: Callable[[dict[str, Any]], None],
) -> None:
    client = TestClient(app)
    payload = copy.deepcopy(load_prompt_request())
    mutate_payload(payload)

    response = client.post("/v1/prompts/run", json=payload)

    assert response.status_code == 422
