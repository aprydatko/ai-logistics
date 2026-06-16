import { NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";

import type { DatabaseService } from "../../../db/database.service";
import { drivers, loads } from "../../../db/schema";

/**
 * Validates that a related entity (driver or load) exists in the database.
 *
 * This function checks the existence of a driver or load record before allowing
 * a document to be associated with it. It throws a NotFoundException if the
 * record doesn't exist, preventing orphaned document references.
 *
 * @param client - Database client for executing queries
 * @param table - The database table to check (drivers or loads)
 * @param id - The ID of the entity to validate
 * @param label - Human-readable label for error messages ("Driver" or "Load")
 * @throws NotFoundException if the entity doesn't exist
 */
export async function assertDocumentRelationExists(
  client: DatabaseService["client"],
  table: typeof drivers | typeof loads,
  id: string,
  label: "Driver" | "Load",
): Promise<void> {
  const [record] = await client
    .select({ id: table.id })
    .from(table)
    .where(eq(table.id, id))
    .limit(1);

  if (!record) throw new NotFoundException(`${label} was not found`);
}
