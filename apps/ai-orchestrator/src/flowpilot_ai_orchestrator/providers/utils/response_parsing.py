def extract_openai_compatible_content(response_body: dict[str, object]) -> str:
    choices = response_body.get("choices")

    if not isinstance(choices, list) or not choices:
        raise ValueError("OpenAI-compatible response has no choices")

    first_choice = choices[0]

    if not isinstance(first_choice, dict):
        raise ValueError("OpenAI-compatible response choice is invalid")

    message = first_choice.get("message")

    if not isinstance(message, dict):
        raise ValueError("OpenAI-compatible response has no message")

    content = message.get("content")

    if not isinstance(content, str) or not content.strip():
        raise ValueError("OpenAI-compatible response content is empty")

    return content


def extract_openai_compatible_finish_reason(
    response_body: dict[str, object],
) -> str | None:
    first_choice = get_first_choice(response_body)

    if first_choice is None:
        return None

    finish_reason = first_choice.get("finish_reason")

    return finish_reason if isinstance(finish_reason, str) else None


def extract_openai_compatible_token_usage(
    response_body: dict[str, object],
) -> tuple[int | None, int | None]:
    usage = response_body.get("usage")

    if not isinstance(usage, dict):
        return None, None

    input_tokens = usage.get("prompt_tokens")
    output_tokens = usage.get("completion_tokens")

    return (
        input_tokens if is_non_negative_integer(input_tokens) else None,
        output_tokens if is_non_negative_integer(output_tokens) else None,
    )


def get_first_choice(response_body: dict[str, object]) -> dict[str, object] | None:
    choices = response_body.get("choices")

    if not isinstance(choices, list) or not choices:
        return None

    first_choice = choices[0]

    return first_choice if isinstance(first_choice, dict) else None


def is_non_negative_integer(value: object) -> bool:
    return isinstance(value, int) and value >= 0
