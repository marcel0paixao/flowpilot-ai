# Event Contracts

Initial RabbitMQ events use JSON payloads and carry tenant and correlation metadata on every message.

## Shared Fields

- `eventName`: stable event name.
- `eventId`: unique event identifier.
- `occurredAt`: ISO 8601 timestamp.
- `workspaceId`: tenant boundary for the event.
- `correlationId`: request or workflow correlation identifier.

## Initial Events

- `workflow.execution.requested`
- `workflow.execution.started`
- `node.execution.started`
- `node.execution.completed`
- `node.execution.failed`
- `workflow.execution.completed`
- `workflow.execution.failed`
- `ai.trace.created`

## Source Of Truth

TypeScript contracts live in `packages/contracts/src/index.ts`.
