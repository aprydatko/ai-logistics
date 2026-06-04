# Testing

## Current Checks

This repo currently has linting, formatting, type checking, build scripts, web
unit tests, web coverage, and Playwright E2E tests.

- Install dependencies: `pnpm install`
- Run dev servers: `pnpm dev`
- Lint: `pnpm lint`
- Type check: `pnpm check-types`
- Build: `pnpm build`
- Format: `pnpm format`
- Web unit tests: `pnpm --filter web test`
- Web coverage: `pnpm --filter web test:coverage`
- Web E2E tests: `pnpm --filter web test:e2e`

## What To Run

- Documentation-only change: usually no test command needed.
- Shared types or DTOs: run `pnpm check-types`.
- UI component change: run `pnpm lint`, `pnpm check-types`, and `pnpm --filter web test`.
- App page, auth, or routing change: run `pnpm lint`, `pnpm check-types`, `pnpm --filter web test`, and test the page locally.
- Critical browser flow change: run `pnpm --filter web test:e2e`.
- Large cross-package change: run `pnpm build`.

## CI Reports

GitHub Actions runs:

- `Lint, Type Check, and Unit Tests`: lint, type check, web unit tests with coverage.
- `Web E2E Tests`: Playwright E2E tests after the first job succeeds.

The workflow publishes JUnit-based GitHub Checks for web unit and E2E tests.
Pull requests receive a sticky web coverage comment, and the same coverage table
is written to the workflow step summary.

When Playwright fails, download these workflow artifacts:

- `playwright-report`: HTML report.
- `playwright-test-results`: traces, screenshots, and videos for failed tests.

## Test Standard

Prefer focused tests around behavior:

- Domain helpers: unit tests.
- API contracts and DTO transformations: contract-style tests.
- Critical logistics flows: integration or end-to-end tests.
- UI components with real states: render tests for loading, empty, error, and success.

Do not add tests only to satisfy coverage. Add tests when they protect real behavior.
