import httpx
import pytest

from flowpilot_ai_orchestrator.clients.credentials import CredentialSecret
from flowpilot_ai_orchestrator.providers.openrouter import OpenRouterProvider
from flowpilot_ai_orchestrator.schemas import PromptRunConfig, PromptRunContext


class FakeCredentialClient:
    def __init__(self) -> None:
        self.calls: list[tuple[str, str]] = []

    def get_secret(self, workspace_id: str, credential_id: str) -> CredentialSecret:
        self.calls.append((workspace_id, credential_id))
        return CredentialSecret(
            id=credential_id,
            workspaceId=workspace_id,
            type="openrouter",
            kind="llm",
            capabilities=["llm.chat"],
            value="sk-openrouter",
        )


class FakeResponse:
    def json(self) -> dict[str, object]:
        return {
            "choices": [
                {
                    "message": {
                        "content": "OpenRouter summary",
                    },
                },
            ],
        }


def test_openrouter_provider_builds_request_and_returns_prompt_result(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, object] = {}

    def fake_post(
        url: str,
        *,
        headers: dict[str, str],
        json: dict[str, object],
    ) -> FakeResponse:
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        return FakeResponse()

    credential_client = FakeCredentialClient()
    monkeypatch.setattr(httpx, "post", fake_post)

    result = OpenRouterProvider(credential_client=credential_client).run(
        context=make_context(),
        config=PromptRunConfig(
            prompt="Summarize this lead.",
            provider="openrouter",
            credentialId="credential-1",
            model="openai/gpt-oss-20b:free",
            temperature=0.2,
        ),
        input_data={"leadId": "lead-1"},
    )

    assert credential_client.calls == [("workspace-1", "credential-1")]
    assert captured["url"] == "https://openrouter.ai/api/v1/chat/completions"
    assert captured["headers"] == {"Authorization": "Bearer sk-openrouter"}
    assert captured["json"] == {
        "model": "openai/gpt-oss-20b:free",
        "temperature": 0.2,
        "messages": [
            {
                "role": "user",
                "content": 'Summarize this lead.\n\nInput:\n{"leadId": "lead-1"}',
            },
        ],
    }
    assert result.provider == "openrouter"
    assert result.summary == "OpenRouter summary"
    assert result.trace.deterministic is False


def test_openrouter_provider_requires_credential_id() -> None:
    credential_client = FakeCredentialClient()

    with pytest.raises(RuntimeError, match="requires credentialId"):
        OpenRouterProvider(credential_client=credential_client).run(
            context=make_context(),
            config=PromptRunConfig(
                prompt="Summarize this lead.",
                provider="openrouter",
                model="openai/gpt-oss-20b:free",
                temperature=0.2,
            ),
            input_data={"leadId": "lead-1"},
        )

    assert credential_client.calls == []


def make_context() -> PromptRunContext:
    return PromptRunContext(
        workspaceId="workspace-1",
        workflowId="workflow-1",
        executionId="execution-1",
        nodeExecutionId="node-execution-1",
        nodeId="ai-summary",
        correlationId="correlation-1",
    )
