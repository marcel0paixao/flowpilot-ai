from fastapi import FastAPI

from flowpilot_ai_orchestrator.schemas import PromptRunRequest, PromptRunResponse
from flowpilot_ai_orchestrator.service import PromptService

app = FastAPI(
    title="FlowPilot AI Orchestrator",
    version="0.1.0",
)

prompt_service = PromptService()

@app.post("/v1/prompts/run", response_model=PromptRunResponse)
def run_prompt(request: PromptRunRequest) -> PromptRunResponse:
    return prompt_service.run_prompt(request)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
