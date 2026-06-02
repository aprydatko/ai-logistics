# Codex Instructions

## Project Overview

This is a TypeScript logistics monorepo built with pnpm, Turborepo, Next.js, and shared workspace packages.

- `apps/web`: main product app.
- `apps/docs`: docs or internal documentation app.
- `packages/shared`: shared domain types and DTOs.
- `packages/ui`: shared React UI components.
- `packages/eslint-config` and `packages/typescript-config`: shared tooling config.

## Commands

- Install: `pnpm install`
- Dev all apps: `pnpm dev`
- Dev web: `pnpm --filter web dev`
- Dev docs: `pnpm --filter docs dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Type check: `pnpm check-types`
- Format: `pnpm format`

## Working Style

- Make small, focused changes that solve the current problem.
- Follow existing folder structure and naming before adding new patterns.
- Prefer readable code over clever abstractions.
- Do not move files, rename public types, or change package exports unless the task needs it.
- Keep generated files, build output, `.next`, `node_modules`, and `.turbo` untouched.

## Code Style

- Use strict TypeScript types. Avoid `any`; use `unknown` when the shape is not known yet.
- Keep names direct and domain-based: `Driver`, `Load`, `Incident`, `User`.
- Use explicit return types for exported functions and shared package APIs.
- Keep UI components small, typed, and reusable only when reuse is real.
- Handle loading, empty, and error states in user-facing flows.

## Architecture Rules

- Apps can depend on shared packages; shared packages should not depend on apps.
- Put cross-app domain contracts in `packages/shared`.
- Put reusable UI primitives in `packages/ui`; app-specific UI stays inside the app.
- Keep logistics domain language consistent across types, DTOs, UI labels, and docs.
- Validate external data at boundaries before treating it as trusted domain data.

## Shared Types Rules

- Export public shared types through `packages/shared/src/index.ts`.
- Keep domain types in `packages/shared/src/types`.
- Keep API request/response DTOs in `packages/shared/src/dto`.
- Do not break existing shared type fields without updating all consumers.
- Prefer clear optional fields over vague nullable fields.

## Verification

Before finishing code changes, run the smallest useful check:

- Docs-only changes: no command required unless formatting changed.
- Type or package changes: `pnpm check-types`.
- UI/app changes: `pnpm lint` and `pnpm check-types`.
- Broad changes: `pnpm build`.

Use `docs/review-checklist.md` as the final review guide.
