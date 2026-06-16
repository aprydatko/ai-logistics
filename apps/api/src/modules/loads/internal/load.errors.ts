/**
 * Type guard to check if an error is a PostgreSQL unique violation.
 *
 * PostgreSQL returns error code 23505 for unique constraint violations.
 * This guard safely checks the error shape and code field.
 *
 * @param error - Unknown error object to check
 * @returns True if error is a PostgreSQL unique violation (code 23505)
 */
export function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
