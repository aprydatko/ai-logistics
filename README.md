# AI Logistics

TypeScript monorepo for a logistics product. The project uses pnpm workspaces, Turborepo, Next.js, and shared packages for domain types and UI.

## Stack

- pnpm
- Turborepo
- TypeScript
- Next.js
- React
- ESLint
- Prettier

## Structure

```txt
apps/
  web/      Main product app
  docs/     Documentation app

packages/
  shared/   Shared logistics types and DTOs
  ui/       Shared React UI components
  eslint-config/
  typescript-config/
```

## Getting Started

```sh
pnpm install
pnpm dev
```

Useful app commands:

```sh
pnpm --filter web dev
pnpm --filter docs dev
```

## Checks

```sh
pnpm lint
pnpm check-types
pnpm build
pnpm format
```

## Project Docs

- `AGENTS.md`: Codex working rules.
- `docs/architecture.md`: repository structure and dependency direction.
- `docs/coding-standards.md`: core coding standards.
- `docs/testing.md`: verification guidance.
- `docs/review-checklist.md`: review checklist.
