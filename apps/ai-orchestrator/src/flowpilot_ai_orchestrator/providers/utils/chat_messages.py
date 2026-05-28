import json

from flowpilot_ai_orchestrator.schemas import PromptRunConfig


def build_chat_messages(
    *,
    config: PromptRunConfig,
    input_data: dict[str, object],
) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []

    if config.system_prompt:
        messages.append({"role": "system", "content": config.system_prompt})

    user_content = (
        f"{config.prompt}\n\n"
        f"Input:\n{json.dumps(input_data, ensure_ascii=False, sort_keys=True)}"
    )
    messages.append({"role": "user", "content": user_content})

    return messages
