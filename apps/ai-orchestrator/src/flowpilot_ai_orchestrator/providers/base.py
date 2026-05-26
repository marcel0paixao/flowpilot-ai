from abc import ABC, abstractmethod

from flowpilot_ai_orchestrator.schemas import PromptRunConfig, PromptRunResult


class PromptProvider(ABC):
    provider_name: str

    @abstractmethod
    def run(
        self,
        *,
        config: PromptRunConfig,
        input_data: dict[str, object],
    ) -> PromptRunResult:
        raise NotImplementedError
