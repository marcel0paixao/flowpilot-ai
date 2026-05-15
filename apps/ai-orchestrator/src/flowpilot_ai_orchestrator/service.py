from flowpilot_ai_orchestrator.providers import DeterministicPromptProvider
from flowpilot_ai_orchestrator.schemas import PromptRunRequest, PromptRunResponse


class PromptService:
    def __init__(self) -> None:
        self.provider = DeterministicPromptProvider()

    def run_prompt(self, request: PromptRunRequest) -> PromptRunResponse:
        result = self.provider.run(
            config=request.config,
            input_data=request.input,
        )

        return PromptRunResponse(result=result)
