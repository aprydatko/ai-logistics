# Code Review Checklist

Use this before merging or finishing a Codex change.

## Product

- [ ] The change solves the real user or business problem.
- [ ] The UI handles loading, empty, error, and success states when relevant.
- [ ] Domain language is consistent: `Driver`, `Load`, `Incident`, `User`.

## Architecture

- [ ] Code is placed in the package or app that owns it.
- [ ] Shared logic is only moved to `packages/*` when it is truly shared.
- [ ] Apps depend on packages, not the other way around.
- [ ] Public exports are intentional and stable.

## Code Quality

- [ ] Types are clear and no unnecessary `any` was added.
- [ ] DTOs are used for API request/response shapes.
- [ ] Naming is simple and readable.
- [ ] No duplicated logic, dead code, or unused imports.
- [ ] Errors are handled instead of ignored.

## Safety

- [ ] External input is validated or narrowed before use.
- [ ] No secrets, tokens, or private data were committed.
- [ ] Existing shared type contracts were not broken accidentally.

## Verification

- [ ] Ran the smallest useful check: `pnpm check-types`, `pnpm lint`, or `pnpm build`.
- [ ] Manually checked the affected page or flow when UI changed.
- [ ] Added or updated tests when behavior became more complex.
