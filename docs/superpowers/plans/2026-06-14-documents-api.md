# Documents API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist document metadata and connect the documents list, detail, edit, and hard-delete flows to a typed NestJS API.

**Architecture:** Add shared document contracts, a Drizzle `documents` table, and a focused NestJS module following the existing Loads and Incidents patterns. The web app validates API responses with Zod, uses React Query for server pagination and mutations, and keeps preview/extraction content static while replacing its metadata with API data.

**Tech Stack:** TypeScript, PostgreSQL, Drizzle ORM, NestJS, class-validator, Next.js App Router, React Query, Zod, Vitest.

---

### Task 1: Add Shared Document Contracts

**Files:**
- Create: `packages/shared/src/types/document.ts`
- Create: `packages/shared/src/dto/document.dto.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] Define document type/status unions, linked driver/load summaries, and the public `Document` shape.
- [ ] Define list query, update, and delete response DTO types.
- [ ] Export all document contracts from `packages/shared/src/index.ts`.
- [ ] Run `pnpm --filter @repo/shared check-types`; expect PASS.

### Task 2: Add The Documents Database Schema

**Files:**
- Create: `apps/api/src/db/schema/documents.ts`
- Modify: `apps/api/src/db/schema/index.ts`
- Generate: `apps/api/drizzle/0015_*.sql`
- Modify: `apps/api/seeds/demo.sql`

- [ ] Add enums `document_type` and `document_status`.
- [ ] Add the `documents` table with immutable file metadata, nullable
  `driverId`/`loadId`, timestamps, `ON DELETE SET NULL`, and required indexes.
- [ ] Export the schema and inferred record types.
- [ ] Run `pnpm db:generate`; inspect the generated migration for enums, table,
  foreign keys, and indexes.
- [ ] Extend demo seed SQL with document rows linked through existing driver and
  load reference lookups.

### Task 3: Implement Backend DTO Validation

**Files:**
- Create: `apps/api/src/modules/documents/dto/list-documents-query.dto.ts`
- Create: `apps/api/src/modules/documents/dto/update-document.dto.ts`

- [ ] Add a failing validation test for invalid enums, UUIDs, limits, and
  immutable update fields.
- [ ] Run the focused API test and confirm RED because DTOs do not exist.
- [ ] Implement query transforms/defaults and strict update validation.
- [ ] Re-run the focused test and confirm GREEN.

### Task 4: Implement Documents Service CRUD

**Files:**
- Create: `apps/api/src/modules/documents/documents.types.ts`
- Create: `apps/api/src/modules/documents/documents.service.ts`
- Create: `apps/api/src/modules/documents/documents.service.test.ts`

- [ ] Write failing service tests for list mapping, detail not-found, relation
  validation, update, hard delete, and nullable relation mapping.
- [ ] Run the focused service test and confirm RED.
- [ ] Implement database-level filters, stable sorting, pagination, relation
  joins, ISO serialization, update validation, and hard delete.
- [ ] Re-run service tests and confirm GREEN.

### Task 5: Add Controller And Module

**Files:**
- Create: `apps/api/src/modules/documents/documents.controller.ts`
- Create: `apps/api/src/modules/documents/documents.controller.test.ts`
- Create: `apps/api/src/modules/documents/documents.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] Write failing controller metadata tests proving PATCH and DELETE require
  `admin`/`dispatcher` and `RolesGuard`.
- [ ] Implement GET list/detail, PATCH update, and DELETE endpoints with UUID
  parsing and JWT protection.
- [ ] Register `DocumentsModule` in `AppModule`.
- [ ] Run focused controller and service tests; expect PASS.

### Task 6: Add Web Query And Mutation Clients

**Files:**
- Create: `apps/web/lib/documents/documents-query.ts`
- Create: `apps/web/lib/documents/document-mutations.ts`
- Create: `apps/web/lib/documents/documents-query.test.ts`
- Create: `apps/web/lib/documents/document-mutations.test.ts`

- [ ] Write failing tests for query-string construction, response parsing,
  PATCH body/method, DELETE method, and server error extraction.
- [ ] Run focused web tests and confirm RED.
- [ ] Implement Zod schemas, query options, detail query options, update, and
  delete requests.
- [ ] Re-run focused tests and confirm GREEN.

### Task 7: Connect The Documents Table

**Files:**
- Modify: `apps/web/components/documents/types.ts`
- Modify: `apps/web/components/documents/documents-toolbar.tsx`
- Modify: `apps/web/components/documents/document-row.tsx`
- Modify: `apps/web/components/documents/documents-table.tsx`
- Create: `apps/web/components/documents/documents-table-skeleton.tsx`
- Delete: `apps/web/components/documents/mock-documents.ts`
- Delete: `apps/web/components/documents/filter-documents.ts`
- Delete: `apps/web/components/documents/filter-documents.test.ts`

- [ ] Replace local filtering with debounced API filters and pagination state.
- [ ] Use the existing driver candidates query for complete driver options and
  static enum-backed document type options.
- [ ] Add loading, error, empty, and populated states.
- [ ] Preserve selection behavior and clear selection on query changes.
- [ ] Make pagination use API metadata.
- [ ] Run web type checks; expect PASS.

### Task 8: Add Edit And Delete Dialogs

**Files:**
- Create: `apps/web/components/documents/document-edit-dialog.tsx`
- Create: `apps/web/components/documents/delete-document-dialog.tsx`
- Modify: `apps/web/components/documents/document-row.tsx`
- Modify: `apps/web/components/documents/documents-table.tsx`

- [ ] Add action callbacks for View, Edit, Download, and Delete.
- [ ] Add a controlled edit form for type, driver, load, and status.
- [ ] Add hard-delete confirmation with pending and error states.
- [ ] Invalidate list/detail queries after successful mutations.
- [ ] Keep Download disabled because file storage is not implemented.
- [ ] Run `pnpm --filter web check-types`; expect PASS.

### Task 9: Connect The Detail Route

**Files:**
- Modify: `apps/web/app/(dashboard)/documents/[id]/page.tsx`
- Modify: `apps/web/components/documents/document-review.tsx`

- [ ] Fetch and validate document metadata by route ID.
- [ ] Render loading, error, and not-found states.
- [ ] Replace static header/link/metadata values with API document fields.
- [ ] Keep preview, extracted fields, and audit events as placeholders.
- [ ] Preserve the `/documents` back link.

### Task 10: Full Verification

**Files:**
- Review: `docs/review-checklist.md`

- [ ] Run `pnpm --filter api test`; expect all API tests PASS.
- [ ] Run `pnpm --filter web test`; expect all web tests PASS.
- [ ] Run `pnpm lint`; expect PASS.
- [ ] Run `pnpm check-types`; expect PASS.
- [ ] Run `pnpm build`; expect PASS.
- [ ] Run `git diff --check`; expect no whitespace errors.
- [ ] If PostgreSQL is available, run migration and seed, then manually verify
  filtering, pagination, edit, delete, detail, and back navigation.
