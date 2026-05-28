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
