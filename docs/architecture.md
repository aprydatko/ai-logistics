# Architecture

## Shape

This repository is a pnpm + Turborepo monorepo.

- `apps/web`: product application.
- `apps/docs`: documentation/internal app.
- `packages/shared`: shared logistics domain types and DTOs.
- `packages/ui`: shared React components.
- `packages/eslint-config`: shared lint rules.
- `packages/typescript-config`: shared TypeScript config.

## Dependency Direction

Apps may import from packages:

- `apps/*` -> `packages/shared`
- `apps/*` -> `packages/ui`

Packages should stay independent from apps:

- `packages/shared` must not import from `apps/*`.
- `packages/ui` should not contain product-specific business logic.

## Domain Rules

- Shared logistics concepts belong in `packages/shared`.
- UI display choices belong in apps or `packages/ui`, not in domain types.
- API contracts should use DTOs, not random inline object shapes.
- Keep names stable across the app: if the domain says `Load`, do not introduce `Shipment` for the same thing without a reason.

## When Adding Code

- Add code near the feature that owns it.
- Move code to a shared package only after it is reused or clearly part of a public contract.
- Keep package exports intentional and small.
