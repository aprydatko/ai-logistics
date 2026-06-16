/**
 * Type-safe check for a PostgreSQL unique constraint violation error.
 *
 * Inspects the unknown error object for the PostgreSQL error code `23505`
 * which is emitted when an INSERT or UPDATE violates a UNIQUE index.
 * Safe to call with any thrown value since it guards the type before access.
 *
 * @param error - Any caught error value
 * @returns `true` if the error is a PostgreSQL unique violation, `false` otherwise
 */
export function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
