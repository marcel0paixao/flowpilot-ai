from abc import ABC, abstractmethod

from flowpilot_ai_orchestrator.schemas import PromptRunConfig, PromptRunContext, PromptRunResult


class ProviderConfigurationError(ValueError):
    def __init__(self, message: str, *, provider: str) -> None:
        self.provider = provider
        super().__init__(message)


class PromptProvider(ABC):
    provider_name: str

    @abstractmethod
    def run(
        self,
        *,
        context: PromptRunContext,
        config: PromptRunConfig,
        input_data: dict[str, object],
    ) -> PromptRunResult:
        raise NotImplementedError
