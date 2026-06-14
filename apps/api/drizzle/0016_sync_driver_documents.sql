INSERT INTO "documents" (
  "id",
  "file_name",
  "file_size",
  "type",
  "status",
  "driver_id",
  "uploaded_at",
  "created_at",
  "updated_at"
)
SELECT
  "driver_documents"."id",
  "driver_documents"."name",
  COALESCE("driver_documents"."file_size", 0),
  'driver_license'::"document_type",
  'complete'::"document_status",
  "driver_documents"."driver_id",
  "driver_documents"."created_at",
  "driver_documents"."created_at",
  "driver_documents"."updated_at"
FROM "driver_documents"
WHERE NOT EXISTS (
  SELECT 1
  FROM "documents"
  WHERE "documents"."id" = "driver_documents"."id"
);
