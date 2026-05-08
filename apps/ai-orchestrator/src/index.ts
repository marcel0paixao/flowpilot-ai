import { createLogger } from "@flowpilot/logger";

const logger = createLogger("ai-orchestrator", "debug");

export interface DeterministicAiPromptRequest {
  input: Record<string, unknown>;
  model: string;
  prompt: string;
  temperature: number;
}

export function runDeterministicAiPrompt({
  input,
  model,
  prompt,
  temperature
}: DeterministicAiPromptRequest) {
  const inputKeys = Object.keys(input).sort();
  const compactInput = JSON.stringify(input);

  return {
    provider: "flowpilot-mock-ai",
    model,
    prompt,
    temperature,
    summary: `Mock AI response for ${inputKeys.length} input fields: ${inputKeys.join(", ") || "none"}.`,
    tokens: {
      input: Math.ceil((prompt.length + compactInput.length) / 4),
      output: Math.max(12, Math.ceil(inputKeys.join(" ").length / 4))
    },
    trace: {
      deterministic: true,
      inputKeys
    }
  };
}

logger.info("AI orchestrator scaffold ready", {
  owns: ["LangChain flows", "RAG", "memory", "tools", "provider abstraction"],
  emits: ["ai.trace.created"]
});
