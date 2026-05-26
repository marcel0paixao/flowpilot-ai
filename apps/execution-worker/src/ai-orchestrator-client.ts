export type AiPromptRunInput = {
  workspaceId: string;
  workflowId: string;
  executionId: string;
  nodeExecutionId: string;
  nodeId: string;
  correlationId: string;
  input: Record<string, unknown>;
  prompt: string;
  provider: string;
  model: string;
  temperature: number;
};

export type AiPromptRunResult = Record<string, unknown>;

export class AiOrchestratorClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = 5_000
  ) {}

  async runPrompt(request: AiPromptRunInput): Promise<AiPromptRunResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v1/prompts/run`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(createPromptRunPayload(request)),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`AI orchestrator request failed with status ${response.status}`);
      }

      const data: unknown = await response.json();

      if (!isRecord(data) || !isRecord(data.result)) {
        throw new Error("AI orchestrator response did not include a result object");
      }

      return data.result;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function createPromptRunPayload(request: AiPromptRunInput) {
  return {
    context: {
      workspaceId: request.workspaceId,
      workflowId: request.workflowId,
      executionId: request.executionId,
      nodeExecutionId: request.nodeExecutionId,
      nodeId: request.nodeId,
      correlationId: request.correlationId
    },
    config: {
      prompt: request.prompt,
      provider: request.provider,
      model: request.model,
      temperature: request.temperature
    },
    input: request.input
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
