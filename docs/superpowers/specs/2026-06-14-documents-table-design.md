# Documents Table Design

## Goal

Replace the current `/documents` review screen with a compact documents table
that follows the existing Drivers, Loads, and Incidents UI patterns. Move the
existing document review UI to a dynamic `/documents/[id]` route.

This iteration is UI-only. Document data and interactions may use local mock
data without API integration.

## Routes

- `/documents` renders the documents table.
- `/documents/[id]` renders the existing `DocumentReview` UI.
- The review screen's back action navigates to `/documents`.
- Opening a review is possible only from the row action menu. Clicking a
  document name does not navigate, which avoids accidental page changes.

## Documents Table

The table uses the same visual structure as the existing dashboard tables:

- A toolbar above a bordered, scrollable data table.
- A sticky table header.
- Row selection checkboxes.
- A compact action menu in the final column.
- A visual pagination footer.

Columns:

1. Selection checkbox
2. Document
3. Type
4. Driver
5. Load
6. Status
7. Uploaded
8. Actions

The Document cell displays the file name as non-interactive text and secondary
metadata such as file size or upload date.

## Toolbar And Filtering

The toolbar contains:

- Text search
- Driver filter
- Document type filter
- Processing status filter
- Reset action

Search and filters operate locally against the mock document collection.
Filtering is intentionally simple and prepares the UI for later API-backed
query parameters.

## Row Actions

The three-dot action menu contains:

- View document: navigates to `/documents/[id]`
- Download: mock action with no backend behavior
- Delete: mock action with no backend behavior

Only View document changes routes.

## Component Structure

- `app/(dashboard)/documents/page.tsx` remains a thin route component.
- `app/(dashboard)/documents/[id]/page.tsx` renders `DocumentReview`.
- Documents table components live under `components/documents`.
- Table, toolbar, row, mock types, and mock data are separated when doing so
  keeps components focused and aligned with existing dashboard patterns.
- Existing shared UI primitives from `@repo/ui` are reused.

## UI States

Because this iteration uses local mocks:

- Populated state displays the mock documents.
- Empty state appears when filters match no documents.
- Loading and request error states are not simulated because there is no
  asynchronous data source.

## Verification

- Run `pnpm lint`.
- Run `pnpm check-types`.
- Manually verify `/documents`.
- Manually verify navigation from the action menu to `/documents/[id]`.
- Manually verify the back action returns to `/documents`.
- Check the final change against `docs/review-checklist.md`.
