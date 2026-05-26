import pytest

from flowpilot_ai_orchestrator.providers.deterministic import DeterministicPromptProvider
from flowpilot_ai_orchestrator.providers.registry import ProviderRegistry
from flowpilot_ai_orchestrator.schemas import PromptRunConfig, PromptRunRequest
from flowpilot_ai_orchestrator.service import PromptService


def test_provider_registry_returns_registered_provider() -> None:
    registry = ProviderRegistry()

    provider = registry.get("deterministic")

    assert isinstance(provider, DeterministicPromptProvider)


def test_provider_registry_rejects_unknown_provider() -> None:
    registry = ProviderRegistry()

    with pytest.raises(ValueError, match="Unknown AI provider: unknown"):
        registry.get("unknown")


def test_prompt_service_uses_provider_from_request_config() -> None:
    service = PromptService()
    request = PromptRunRequest(
        context={
            "workspaceId": "workspace-1",
            "workflowId": "workflow-1",
            "executionId": "execution-1",
            "nodeExecutionId": "node-execution-1",
            "nodeId": "ai-summary",
            "correlationId": "correlation-1",
        },
        config=PromptRunConfig(
            prompt="Summarize this lead.",
            provider="deterministic",
            model="mock-flowpilot-llm",
            temperature=0.2,
        ),
        input={
            "leadId": "lead-1",
            "email": "lead@example.test",
        },
    )

    response = service.run_prompt(request)

    assert response.result.provider == "deterministic"
    assert response.result.model == "mock-flowpilot-llm"
    assert response.result.summary == "Mock AI response for 2 input fields: email, leadId."
