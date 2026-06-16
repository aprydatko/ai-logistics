import { eq, ilike, inArray, or, type AnyColumn, type SQL } from "drizzle-orm";

import type { DatabaseService } from "../../../db/database.service";
import {
  documents,
  driverDocuments,
  drivers,
  loads,
  users,
} from "../../../db/schema";
import type { ListDocumentsQueryDto } from "../dto/list-documents-query.dto";
import { documentTypeLabels } from "./document.constants";

/**
 * Builds a base query for selecting documents with all related data.
 *
 * This function creates a Drizzle query builder that selects documents along with
 * their related user (uploaded by), driver, load, and driver document information.
 * It uses left joins to ensure documents are returned even if relations are missing.
 *
 * @param client - Database client for executing queries
 * @returns Drizzle query builder with document and relation selections
 */
export function documentBaseSelect(client: DatabaseService["client"]) {
  return client
    .select({
      document: documents,
      driverDocumentFileUrl: driverDocuments.fileUrl,
      driverDocumentMimeType: driverDocuments.mimeType,
      uploadedBy: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      },
      driver: {
        id: drivers.id,
        firstName: drivers.firstName,
        lastName: drivers.lastName,
      },
      load: {
        id: loads.id,
        referenceNumber: loads.referenceNumber,
      },
    })
    .from(documents)
    .leftJoin(driverDocuments, eq(documents.id, driverDocuments.id))
    .leftJoin(users, eq(documents.uploadedByUserId, users.id))
    .leftJoin(drivers, eq(documents.driverId, drivers.id))
    .leftJoin(loads, eq(documents.loadId, loads.id));
}

/**
 * Builds an array of SQL filter conditions based on query parameters.
 *
 * This function constructs dynamic SQL filters for document queries including:
 * - Full-text search across filename, load reference, driver names, and document types
 * - Exact matches for driver ID, load ID, document type, and status
 * The search functionality performs case-insensitive pattern matching and includes
 * document type labels in the search.
 *
 * @param query - Query parameters containing filter criteria
 * @returns Array of SQL filter conditions to be combined with AND logic
 */
export function buildDocumentFilters(query: ListDocumentsQueryDto): SQL[] {
  const filters: SQL[] = [];
  if (query.search) {
    const pattern = `%${query.search}%`;
    const normalizedSearch = query.search.toLowerCase();
    const matchingTypes = documentTypeLabels
      .filter(([label]) => label.includes(normalizedSearch))
      .map(([, type]) => type);
    const search = or(
      ilike(documents.fileName, pattern),
      ilike(loads.referenceNumber, pattern),
      ilike(drivers.firstName, pattern),
      ilike(drivers.lastName, pattern),
      matchingTypes.length > 0
        ? inArray(documents.type, matchingTypes)
        : undefined,
    );
    if (search) filters.push(search);
  }
  if (query.driverId) filters.push(eq(documents.driverId, query.driverId));
  if (query.loadId) filters.push(eq(documents.loadId, query.loadId));
  if (query.type) filters.push(eq(documents.type, query.type));
  if (query.status) filters.push(eq(documents.status, query.status));
  return filters;
}

/**
 * Resolves the sort column name to the actual database column.
 *
 * This function maps the string sort parameter from the API to the corresponding
 * Drizzle ORM column object. It provides type safety and ensures only valid
 * sort columns can be used.
 *
 * @param sortBy - The sort column name from the query parameters
 * @returns The corresponding Drizzle column object
 */
export function resolveDocumentSortColumn(
  sortBy: ListDocumentsQueryDto["sortBy"],
): AnyColumn {
  return {
    uploadedAt: documents.uploadedAt,
    fileName: documents.fileName,
    type: documents.type,
    status: documents.status,
    updatedAt: documents.updatedAt,
  }[sortBy];
}
