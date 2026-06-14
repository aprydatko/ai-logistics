# Documents API Design

## Goal

Replace the documents table's local mock collection with persistent document
metadata stored in PostgreSQL and exposed through the existing NestJS API.
Support listing, viewing, editing, and hard deletion without adding file upload
or binary storage in this iteration.

## Scope

Included:

- PostgreSQL schema and migration for document metadata.
- Seed data matching the current documents UI.
- Shared document domain types and DTO contracts.
- Authenticated NestJS list, detail, update, and delete endpoints.
- Server-side search, filtering, sorting, and pagination.
- React Query integration for the documents table.
- Edit and delete UI flows.
- Loading, error, empty, and success states.
- API, service, query, and UI behavior tests where appropriate.

Excluded:

- Uploading or storing document files.
- Downloading real files.
- Editing file name, file size, or upload timestamp.
- Persisting extracted fields, audit events, or document preview data.
- Creating new documents through the UI or API.

## Data Model

Create a `documents` table with:

- `id`: UUID primary key.
- `fileName`: required varchar containing the immutable display file name.
- `fileSize`: required integer containing size in bytes.
- `type`: required document type enum.
- `status`: required processing status enum.
- `driverId`: nullable UUID foreign key to `drivers.id`.
- `loadId`: nullable UUID foreign key to `loads.id`.
- `uploadedAt`: required timezone-aware timestamp.
- `createdAt`: required timezone-aware timestamp with current-time default.
- `updatedAt`: required timezone-aware timestamp with current-time default.

Document types:

- `bill_of_lading`
- `proof_of_delivery`
- `rate_confirmation`
- `driver_license`

Document statuses:

- `complete`
- `processing`
- `needs_review`

Foreign keys use `ON DELETE SET NULL`. A document remains available if its
linked driver or load is removed.

Indexes cover `driverId`, `loadId`, `type`, `status`, and `uploadedAt`.

## Shared Contracts

Add document types under `packages/shared/src/types/document.ts` and DTOs under
`packages/shared/src/dto/document.dto.ts`. Export them from the shared package
index.

The public document item includes:

- Immutable file metadata.
- Enum type and status.
- ISO timestamps.
- Nullable linked driver summary: ID, first name, last name.
- Nullable linked load summary: ID and reference number.

List responses use the existing success and pagination response shape.

## API Endpoints

All endpoints require `JwtAuthGuard`.

### `GET /documents`

Supported query parameters:

- `search`: searches file name, driver first/last name, load reference number,
  and human-readable document type.
- `driverId`: UUID.
- `loadId`: UUID.
- `type`: document type enum.
- `status`: document status enum.
- `sortBy`: `uploadedAt`, `fileName`, `type`, `status`, or `updatedAt`.
- `sortOrder`: `asc` or `desc`.
- `page`: positive integer, default `1`.
- `limit`: integer from `1` to `100`, default `20`.

The endpoint performs database-level filtering and pagination. Default order is
`uploadedAt desc`, then `id desc` for stable results.

### `GET /documents/:id`

Returns one document with nullable driver and load summaries. An unknown UUID
returns HTTP 404.

### `PATCH /documents/:id`

Requires `admin` or `dispatcher`.

Editable fields:

- `type`
- `status`
- `driverId`
- `loadId`

`driverId` and `loadId` accept UUID values or `null` to unlink. The service
validates that non-null references exist. Unknown references return HTTP 404.
Immutable file fields supplied by clients are rejected by DTO validation.

### `DELETE /documents/:id`

Requires `admin` or `dispatcher`.

Performs a hard delete and returns a success response containing the deleted
document ID. An unknown UUID returns HTTP 404.

## Backend Structure

Add a focused NestJS `DocumentsModule` containing:

- Controller for HTTP contracts and authorization.
- Service for database queries, relation validation, response mapping, and
  hard deletion.
- Query and update DTO classes with class-validator rules.
- Internal response types aligned with shared contracts.

Register the module in `AppModule` and export the Drizzle schema from the schema
index.

## Frontend Data Flow

Add `apps/web/lib/documents/documents-query.ts` with:

- Zod schemas for runtime response validation.
- Filter-to-query-string conversion.
- React Query options using `keepPreviousData`.

Add `apps/web/lib/documents/document-mutations.ts` with:

- Update mutation request.
- Hard-delete request.
- Typed server error extraction.

The documents table:

- Stores search/filter/page state.
- Fetches server-filtered records with React Query.
- Uses API pagination metadata.
- Builds driver and type filter options from API-backed data. Document type
  options are static enum labels; driver options use the existing driver
  candidates query so all drivers remain selectable even when absent from the
  current document page.
- Clears row selection when filters or page change.
- Displays skeleton, error, and empty table states.
- Invalidates document list/detail queries after mutations.

Local mock data and the pure local filtering helper are removed after the API
integration replaces them.

## Edit Flow

Add a document edit dialog opened from the row action menu.

The form allows changing:

- Document type.
- Driver association, including no driver.
- Load association, including no load.
- Processing status.

File name, file size, and upload timestamp are shown as read-only context or
omitted from the form. Successful updates close the dialog, refresh queries,
and update the visible table.

## Delete Flow

The Delete row action opens a confirmation dialog naming the document.
Confirming calls `DELETE /documents/:id`. Successful deletion closes the
dialog, removes stale selection, and refreshes the table. API errors remain
visible in the dialog.

Download remains a disabled or no-op UI action because binary storage is
outside this scope.

## Detail Route

`/documents/[id]` fetches the document metadata by ID and uses it for the
review header, links, and metadata fields that exist in the API response.
Preview content, extracted fields, and audit events remain static placeholders.

The page handles loading, request failure, and not-found states without
rendering trusted metadata before validation.

## Seed Data

Extend the demo seed with document records corresponding to the current mock
examples. Resolve driver and load IDs from existing seeded records rather than
hard-coding unrelated UUIDs.

## Error Handling

- DTO validation returns HTTP 400 for invalid filters, enums, UUIDs, and update
  bodies.
- Unknown documents, drivers, and loads return HTTP 404.
- Database failures are not converted to successful empty responses.
- Frontend query failures show a table error state.
- Mutation failures remain visible in their dialog and do not close it.

## Testing

Backend tests cover:

- List defaults, filters, search, sorting, and pagination delegation.
- Detail success and not-found behavior.
- Update authorization, editable fields, relation validation, and response.
- Hard delete success and not-found behavior.
- Response mapping for null and populated relations.

Frontend tests cover:

- Query-string construction and Zod response validation.
- Update and delete mutation request shape.
- Table loading, error, empty, and populated states where existing test setup
  supports component testing.

Final verification:

- Generate and inspect the Drizzle migration.
- Run focused API and web tests.
- Run `pnpm lint`.
- Run `pnpm check-types`.
- Run `pnpm build` because the change spans shared contracts, API, database,
  and frontend routes.
- Manually verify list filtering, pagination, edit, delete, detail navigation,
  and back navigation.
