from flowpilot_ai_orchestrator.providers.base import PromptProvider
from flowpilot_ai_orchestrator.providers.deterministic import DeterministicPromptProvider


class UnknownProviderError(ValueError):
    def __init__(self, provider_name: str) -> None:
        self.provider_name = provider_name
        super().__init__(f"Unknown AI provider: {provider_name}")


class ProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, PromptProvider] = {
            "deterministic": DeterministicPromptProvider()
        }

    def get(self, name: str) -> PromptProvider:
        try:
            return self._providers[name]
        except KeyError as error:
            raise UnknownProviderError(name) from error
