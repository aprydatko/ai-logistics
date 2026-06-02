# Coding Standards

## TypeScript

- Prefer precise types over broad types.
- Avoid `any`. Use `unknown` and narrow it when data comes from outside the app.
- Export types from shared packages through an index file.
- Use explicit return types for exported functions.
- Keep optional fields meaningful; do not use `?` just to make errors disappear.

## Naming

- Use domain names that match the product language: `Driver`, `Load`, `Incident`, `User`.
- Use `Dto` suffix for API request/response shapes.
- Use boolean names that read clearly: `isActive`, `hasIncident`, `canAssignLoad`.
- Avoid abbreviations unless they are standard in the domain.

## React

- Keep components focused on one responsibility.
- Put reusable primitives in `packages/ui`.
- Keep page-specific components inside the app that owns the page.
- Always consider loading, empty, and error states.

## Error Handling

- Do not silently ignore errors.
- Show useful user-facing messages without leaking internal details.
- Keep technical details in logs or developer-only surfaces.

## Imports

- Prefer workspace imports such as `@repo/shared` and `@repo/ui`.
- Avoid deep imports from another package unless that package explicitly exports that path.
- Keep imports readable and remove unused code.
