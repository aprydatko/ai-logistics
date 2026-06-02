# Testing

## Current Checks

This repo currently has linting, formatting, type checking, and build scripts.

- Install dependencies: `pnpm install`
- Run dev servers: `pnpm dev`
- Lint: `pnpm lint`
- Type check: `pnpm check-types`
- Build: `pnpm build`
- Format: `pnpm format`

## What To Run

- Documentation-only change: usually no test command needed.
- Shared types or DTOs: run `pnpm check-types`.
- UI component change: run `pnpm lint` and `pnpm check-types`.
- App page or routing change: run `pnpm lint`, `pnpm check-types`, and test the page locally.
- Large cross-package change: run `pnpm build`.

## Future Test Standard

When test tooling is added, prefer focused tests around behavior:

- Domain helpers: unit tests.
- API contracts and DTO transformations: contract-style tests.
- Critical logistics flows: integration or end-to-end tests.
- UI components with real states: render tests for loading, empty, error, and success.

Do not add tests only to satisfy coverage. Add tests when they protect real behavior.
