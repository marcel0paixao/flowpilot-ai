import pytest

from flowpilot_ai_orchestrator.providers.utils import (
    build_chat_messages,
    estimate_text_tokens,
    extract_openai_compatible_content,
)
from flowpilot_ai_orchestrator.schemas import PromptRunConfig


def test_build_chat_messages_includes_system_prompt_and_input_data() -> None:
    messages = build_chat_messages(
        config=PromptRunConfig(
            prompt="Summarize this lead.",
            systemPrompt="Be concise.",
            provider="openrouter",
            model="openai/gpt-oss-20b:free",
            temperature=0.2,
        ),
        input_data={"leadId": "lead-1"},
    )

    assert messages == [
        {"role": "system", "content": "Be concise."},
        {
            "role": "user",
            "content": 'Summarize this lead.\n\nInput:\n{"leadId": "lead-1"}',
        },
    ]


def test_extract_openai_compatible_content_returns_message_content() -> None:
    content = extract_openai_compatible_content(
        {
            "choices": [
                {
                    "message": {
                        "content": "Lead summary",
                    },
                },
            ],
        }
    )

    assert content == "Lead summary"


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"choices": []},
        {"choices": [{}]},
        {"choices": [{"message": {}}]},
        {"choices": [{"message": {"content": ""}}]},
    ],
)
def test_extract_openai_compatible_content_rejects_invalid_payloads(
    payload: dict[str, object],
) -> None:
    with pytest.raises(ValueError):
        extract_openai_compatible_content(payload)


def test_estimate_text_tokens_returns_rough_character_based_estimate() -> None:
    assert estimate_text_tokens("") == 1
    assert estimate_text_tokens("abcd") == 1
    assert estimate_text_tokens("abcde") == 2
