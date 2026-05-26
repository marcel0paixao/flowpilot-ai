from fastapi import FastAPI, HTTPException

from flowpilot_ai_orchestrator.providers.registry import UnknownProviderError
from flowpilot_ai_orchestrator.schemas import PromptRunRequest, PromptRunResponse
from flowpilot_ai_orchestrator.service import PromptService

app = FastAPI(
    title="FlowPilot AI Orchestrator",
    version="0.1.0",
)

prompt_service = PromptService()


@app.post("/v1/prompts/run", response_model=PromptRunResponse)
def run_prompt(request: PromptRunRequest) -> PromptRunResponse:
    try:
        return prompt_service.run_prompt(request)
    except UnknownProviderError as error:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "unknown_ai_provider",
                "message": str(error),
                "provider": error.provider_name,
            },
        ) from error


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
