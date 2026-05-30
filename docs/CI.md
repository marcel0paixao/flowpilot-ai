# CI

FlowPilot AI uses GitHub Actions to keep the portfolio repository reviewable before launch. The pipeline is intentionally pragmatic: it validates the monorepo, runs the Python AI Orchestrator checks, and exercises API integration tests with PostgreSQL, without adding deployment or heavyweight local infrastructure.

## Workflow

The workflow lives at `.github/workflows/ci.yml` and runs on:

- pushes to `main`
- pull requests

Concurrency is enabled so newer commits cancel older runs on the same ref.

## Jobs

### TypeScript monorepo

This job validates the pnpm workspace on Node.js 22:

- `pnpm install --frozen-lockfile`
- `pnpm --filter @flowpilot/api prisma:validate`
- `pnpm --filter @flowpilot/api prisma:generate`
- build shared packages used through workspace package exports
- `pnpm lint`
- `pnpm typecheck`
- TypeScript unit and frontend tests
- `pnpm build`

The API integration specs are excluded from this job because they require a real PostgreSQL database and are covered by the dedicated integration job.

### API integration

This job starts a PostgreSQL 16 service container and runs the API HTTP integration specs against `flowpilot_test`:

- install workspace dependencies
- generate the Prisma client
- build shared packages used by API integration specs
- apply Prisma migrations with `prisma migrate deploy`
- run `tsx --test "src/**/*.integration-spec.ts"` for `@flowpilot/api`

RabbitMQ, Redis, and Qdrant are not started in CI today because the current integration tests run the Nest/Fastify app in `NODE_ENV=test`, where RabbitMQ publishing is bypassed, and the tested paths do not require Redis or vector search.

### Python AI Orchestrator

This job validates `apps/ai-orchestrator` on Python 3.12:

- `python -m pip install -e ".[dev]"`
- `python -m ruff check .`
- `python -m pytest`

The job uses the deterministic provider configuration and does not require external model-provider secrets.

## Secrets

The CI does not require repository secrets. It uses local-only test values for URLs and JWT/internal tokens. Do not add real API keys, provider tokens, private project notes, or production credentials to GitHub Actions configuration.

## Local Equivalents

Run the main validation locally with:

```bash
pnpm install
DATABASE_URL=postgresql://flowpilot:flowpilot@localhost:5432/flowpilot pnpm --filter @flowpilot/api prisma:validate
pnpm --filter @flowpilot/api prisma:generate
pnpm --filter @flowpilot/contracts --filter @flowpilot/config --filter @flowpilot/logger build
pnpm lint
pnpm typecheck
pnpm -r --filter '!@flowpilot/api' test
pnpm --filter @flowpilot/api exec tsx --test "src/**/*.test.ts"
pnpm build
```

Run API integration tests locally with PostgreSQL available:

```bash
docker compose up -d postgres
pnpm --filter @flowpilot/api test:integration
```

Run Python checks locally:

```bash
cd apps/ai-orchestrator
python3.12 -m venv .venv
.venv/bin/python -m pip install -e ".[dev]"
.venv/bin/python -m ruff check .
.venv/bin/python -m pytest
```
