from fastapi.testclient import TestClient

from flowpilot_ai_orchestrator.main import app


def test_prompt_run_returns_deterministic_response() -> None:
    client = TestClient(app)

    response = client.post(
        "/v1/prompts/run",
        json={
            "context": {
                "workspaceId": "workspace-1",
                "workflowId": "workflow-1",
                "executionId": "execution-1",
                "nodeExecutionId": "node-execution-1",
                "nodeId": "ai-node",
                "correlationId": "correlation-1",
            },
            "config": {
                "prompt": "Summarize this lead.",
                "model": "mock-flowpilot-llm",
                "temperature": 0.2,
            },
            "input": {
                "leadId": "lead-1",
                "email": "lead@example.test",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["result"]["provider"] == "flowpilot-mock-ai"
    assert body["result"]["trace"]["deterministic"] is True
    assert body["result"]["trace"]["inputKeys"] == ["email", "leadId"]
