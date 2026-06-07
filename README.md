# AI Logistics

TypeScript monorepo for a logistics product. The project uses pnpm workspaces, Turborepo, Next.js, and shared packages for domain types and UI. Perfect stage.

## Stack

- pnpm
- Turborepo
- TypeScript
- Next.js
- NestJS
- PostgreSQL
- React
- ESLint
- Prettier

## Structure

```txt
apps/
  api/      NestJS API service
  web/      Main product app

packages/
  shared/   Shared logistics types and DTOs
  ui/       Shared React UI components
  eslint-config/
  typescript-config/
```

## Getting Started

```sh
pnpm install
pnpm db:up
pnpm dev
```

Useful app commands:

```sh
pnpm --filter web dev
pnpm dev:api
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:down
```

The local PostgreSQL instance listens on `localhost:5432`. Copy the API environment
example to `apps/api/.env` before connecting the API to the database.

## Checks

```sh
pnpm lint
pnpm check-types
pnpm build
pnpm format
```

Test commands:

```sh
pnpm --filter web test
pnpm --filter web test:coverage
pnpm --filter web test:e2e
```

The CI workflow runs linting, type checking, web unit tests with coverage, and
web Playwright E2E tests. GitHub Checks show unit and E2E test results from
JUnit reports. Pull requests also receive a web unit test coverage comment.
When E2E tests fail, download the Playwright artifacts from the workflow run:

- `playwright-report`: HTML report.
- `playwright-test-results`: traces, screenshots, and videos for failures.

## Project Docs

- `AGENTS.md`: Codex working rules.
- `docs/architecture.md`: repository structure and dependency direction.
- `docs/coding-standards.md`: core coding standards.
- `docs/testing.md`: verification guidance.
- `docs/review-checklist.md`: review checklist.
