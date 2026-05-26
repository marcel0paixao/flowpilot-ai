from flowpilot_ai_orchestrator.providers.base import PromptProvider
from flowpilot_ai_orchestrator.providers.deterministic import DeterministicPromptProvider


class ProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, PromptProvider] = {
            "deterministic": DeterministicPromptProvider()
        }

    def get(self, name: str) -> PromptProvider:
        try:
            return self._providers[name]
        except KeyError as error:
            raise ValueError(f"Unknown AI provider: {name}") from error
