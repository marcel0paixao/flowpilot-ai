import json

import httpx

from flowpilot_ai_orchestrator.clients import CredentialClient
from flowpilot_ai_orchestrator.clients.credentials import ensure_credential_supports
from flowpilot_ai_orchestrator.providers.base import PromptProvider
from flowpilot_ai_orchestrator.providers.utils import (
    build_chat_messages,
    estimate_text_tokens,
    extract_openai_compatible_content,
)
from flowpilot_ai_orchestrator.schemas import (
    PromptRunConfig,
    PromptRunContext,
    PromptRunResult,
    PromptTrace,
    TokenUsage,
)


class OpenRouterProvider(PromptProvider):
    provider_name = "openrouter"

    def __init__(self, credential_client: CredentialClient | None = None) -> None:
        self.credential_client = credential_client or CredentialClient()

    def run(
        self,
        *,
        context: PromptRunContext,
        config: PromptRunConfig,
        input_data: dict[str, object],
    ) -> PromptRunResult:
        input_keys = sorted(input_data.keys())
        compact_input = json.dumps(input_data, separators=(",", ":"), sort_keys=False)

        if config.credential_id is None:
            raise RuntimeError("OpenRouter provider requires credentialId")

        credential = self._get_credential(context.workspace_id, config.credential_id)

        url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            f"Authorization": f"Bearer {credential}"
            # "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
            # "X-OpenRouter-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
        }

        payload = {
            "model": config.model,
            "temperature": config.temperature,
            "messages": build_chat_messages(config=config, input_data=input_data),
        }

        response = httpx.post(url, headers=headers, json=payload)

        summary = extract_openai_compatible_content(response.json())

        return PromptRunResult(
            provider=self.provider_name,
            model=config.model,
            prompt=config.prompt,
            temperature=config.temperature,
            summary=summary,
            tokens=TokenUsage(
                input=estimate_text_tokens(config.prompt + compact_input),
                output=max(12, estimate_text_tokens(summary)),
            ),
            trace=PromptTrace(
                deterministic=False,
                inputKeys=input_keys,
            ),
        )

    def _get_credential(self, workspace_id: str, credential_id: str):
        credential = self.credential_client.get_secret(
            workspace_id=workspace_id, credential_id=credential_id
        )

        ensure_credential_supports(
            credential,
            expected_type="openrouter",
            expected_kind="llm",
            required_capability="llm.chat",
        )

        if credential is None:
            raise RuntimeError("OpenRouter provider requires credentialId")

        return credential.value
