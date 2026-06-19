INSERT INTO "drivers" (
  "id", "driver_code", "first_name", "last_name", "email", "phone",
  "date_of_birth", "address", "hire_date", "license_type", "license_number",
  "license_expiration_date", "license_state", "emergency_contact",
  "emergency_phone", "notes", "truck_number", "trailer_number", "status", "rating"
) VALUES
('10000000-0000-4000-8000-000000000001', 'DEMO-DR-01', 'Marcus', 'Johnson', 'demo.marcus.johnson@example.com', '+13125550101', '1988-04-14', '1842 W Addison St, Chicago, IL', '2022-03-21', 'CDL-A', 'IL-A-882104', '2028-08-12', 'Illinois', 'Tanya Johnson', '+13125550102', 'Long-haul driver with refrigerated freight experience.', 'DEMO-TR-01', 'DEMO-TL-01', 'on_trip', '4.9'),
('10000000-0000-4000-8000-000000000002', 'DEMO-DR-02', 'Elena', 'Rodriguez', 'demo.elena.rodriguez@example.com', '+12145550103', '1992-09-02', '510 Elm St, Dallas, TX', '2024-01-15', 'CDL-A', 'TX-A-440219', '2027-11-03', 'Texas', 'Sofia Rodriguez', '+12145550104', NULL, 'DEMO-TR-02', NULL, 'available', '4.7'),
('10000000-0000-4000-8000-000000000003', 'DEMO-DR-03', 'Daniel', 'Kim', 'demo.daniel.kim@example.com', '+14045550105', NULL, NULL, '2025-06-10', 'CDL-B', 'GA-B-930155', '2027-04-19', 'Georgia', NULL, NULL, NULL, NULL, NULL, 'off_duty', '4.6')
ON CONFLICT DO NOTHING;

INSERT INTO "vehicles" (
  "id", "unit_number", "make", "model", "year", "vin", "license_plate",
  "license_state", "odometer_miles", "status", "last_service_at", "next_service_at"
) VALUES
('20000000-0000-4000-8000-000000000001', 'DEMO-TR-01', 'Volvo', 'VNL 860', 2023, '4V4NC9EH0PN123401', 'IL 8282 AB', 'Illinois', 243420, 'active', '2026-05-20', '2026-08-20'),
('20000000-0000-4000-8000-000000000002', 'DEMO-TR-02', 'Freightliner', 'Cascadia', 2022, '1FUJHHDR7NL123402', 'TX 92K 441', 'Texas', 318900, 'active', '2026-04-11', '2026-07-11')
ON CONFLICT DO NOTHING;

INSERT INTO "driver_vehicle_assignments" (
  "id", "driver_id", "vehicle_id", "assigned_at", "is_primary"
) VALUES
('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '2025-09-01T09:00:00Z', true),
('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '2026-01-20T09:00:00Z', true)
ON CONFLICT DO NOTHING;

INSERT INTO "driver_documents" (
  "id", "driver_id", "type", "name", "document_number", "issued_at", "expires_at"
) VALUES
('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'license', 'Commercial Driver License', 'IL-A-882104', '2024-08-12', '2028-08-12'),
('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'medical_card', 'DOT Medical Certificate', 'DOT-772910', '2025-10-01', '2027-10-01'),
('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'license', 'Commercial Driver License', 'TX-A-440219', '2023-11-03', '2027-11-03')
ON CONFLICT DO NOTHING;

INSERT INTO "loads" (
  "id", "reference_number", "pickup_address", "delivery_address", "pickup_date",
  "delivery_date", "weight", "price", "miles", "status", "broker",
  "route_points", "timeline", "driver_id"
) VALUES
(
  '50000000-0000-4000-8000-000000000001', 'DEMO-LD-01',
  'Chicago, IL', 'Detroit, MI', '2026-06-01T14:30:00Z', '2026-06-02T10:00:00Z',
  28000, 1850.00, 283, 'delivered',
  '{"id":"broker-demo-1","companyName":"Northstar Freight","phone":"+13125550901"}',
  '[{"label":"Chicago pickup","latitude":41.8781,"longitude":-87.6298},{"label":"Detroit delivery","latitude":42.3314,"longitude":-83.0458}]',
  '[{"title":"Load created","description":"Shipment entered by dispatch.","dateTime":"2026-05-31T16:00:00Z"},{"title":"Delivered","description":"Receiver signed the proof of delivery.","dateTime":"2026-06-02T09:42:00Z"}]',
  '10000000-0000-4000-8000-000000000001'
),
(
  '50000000-0000-4000-8000-000000000002', 'DEMO-LD-02',
  'Dallas, TX', 'Houston, TX', '2026-06-05T09:45:00Z', '2026-06-05T16:30:00Z',
  19500, 1125.00, 239, 'delivered',
  '{"id":"broker-demo-2","companyName":"Lone Star Cargo","phone":"+12145550902"}',
  '[{"label":"Dallas distribution center","latitude":32.7767,"longitude":-96.797},{"label":"Houston warehouse","latitude":29.7604,"longitude":-95.3698}]',
  '[{"title":"Picked up","description":"Freight loaded and sealed.","dateTime":"2026-06-05T09:40:00Z"},{"title":"Delivered","description":"Delivery completed on schedule.","dateTime":"2026-06-05T16:18:00Z"}]',
  '10000000-0000-4000-8000-000000000002'
),
(
  '50000000-0000-4000-8000-000000000003', 'DEMO-LD-03',
  'Milwaukee, WI', 'Cleveland, OH', '2026-06-09T07:00:00Z', '2026-06-09T21:00:00Z',
  31000, 2240.00, 436, 'in_transit',
  '{"id":"broker-demo-1","companyName":"Northstar Freight","phone":"+13125550901"}',
  '[{"label":"Milwaukee pickup","latitude":43.0389,"longitude":-87.9065},{"label":"Chicago checkpoint","latitude":41.8781,"longitude":-87.6298},{"label":"Cleveland delivery","latitude":41.4993,"longitude":-81.6944}]',
  '[{"title":"Driver departed","description":"Shipment is moving toward Cleveland.","dateTime":"2026-06-09T07:15:00Z"},{"title":"Checkpoint","description":"Planned fuel stop near Chicago.","dateTime":"2026-06-09T11:30:00Z"}]',
  '10000000-0000-4000-8000-000000000001'
),
(
  '50000000-0000-4000-8000-000000000004', 'DEMO-LD-04',
  'Seattle, WA', 'Portland, OR', '2026-06-11T15:00:00Z', '2026-06-11T20:15:00Z',
  16500, 980.00, 174, 'assigned',
  '{"id":"broker-demo-3","companyName":"Pacific Route Partners","phone":"+12065550903"}',
  '[{"label":"Seattle pickup","latitude":47.6062,"longitude":-122.3321},{"label":"Portland delivery","latitude":45.5152,"longitude":-122.6784}]',
  '[{"title":"Driver assigned","description":"Elena Rodriguez confirmed the load.","dateTime":"2026-06-09T13:00:00Z"},{"title":"Pickup appointment","description":"Dock 12 appointment.","dateTime":"2026-06-11T15:00:00Z"}]',
  '10000000-0000-4000-8000-000000000002'
),
(
  '50000000-0000-4000-8000-000000000005', 'DEMO-LD-05',
  'Denver, CO', 'Salt Lake City, UT', '2026-06-12T13:00:00Z', '2026-06-13T04:00:00Z',
  24500, 2100.00, 518, 'pending',
  '{"id":"broker-demo-4","companyName":"Mountain West Brokerage","phone":"+13035550904"}',
  '[{"label":"Denver pickup","latitude":39.7392,"longitude":-104.9903},{"label":"Grand Junction checkpoint","latitude":39.0639,"longitude":-108.5506},{"label":"Salt Lake City delivery","latitude":40.7608,"longitude":-111.891}]',
  '[{"title":"Load created","description":"Awaiting driver assignment.","dateTime":"2026-06-09T14:00:00Z"}]',
  NULL
),
(
  '50000000-0000-4000-8000-000000000006', 'DEMO-LD-06',
  'Atlanta, GA', 'Miami, FL', '2026-06-14T12:00:00Z', '2026-06-15T08:00:00Z',
  22000, 1980.00, 662, 'cancelled',
  '{"id":"broker-demo-5","companyName":"Southeast Freight Desk","phone":"+14045550905"}',
  '[{"label":"Atlanta pickup","latitude":33.749,"longitude":-84.388},{"label":"Jacksonville checkpoint","latitude":30.3322,"longitude":-81.6557},{"label":"Miami delivery","latitude":25.7617,"longitude":-80.1918}]',
  '[{"title":"Load created","description":"Temperature-controlled shipment requested.","dateTime":"2026-06-08T12:00:00Z"},{"title":"Cancelled","description":"Broker cancelled before pickup.","dateTime":"2026-06-09T10:30:00Z"}]',
  NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "reference_number" = EXCLUDED."reference_number",
  "pickup_address" = EXCLUDED."pickup_address",
  "delivery_address" = EXCLUDED."delivery_address",
  "pickup_date" = EXCLUDED."pickup_date",
  "delivery_date" = EXCLUDED."delivery_date",
  "weight" = EXCLUDED."weight",
  "price" = EXCLUDED."price",
  "miles" = EXCLUDED."miles",
  "status" = EXCLUDED."status",
  "broker" = EXCLUDED."broker",
  "route_points" = EXCLUDED."route_points",
  "timeline" = EXCLUDED."timeline",
  "driver_id" = EXCLUDED."driver_id",
  "updated_at" = NOW();

INSERT INTO "documents" (
  "id", "file_name", "file_size", "type", "status", "driver_id", "load_id",
  "uploaded_at"
) VALUES
(
  '80000000-0000-4000-8000-000000000001',
  'BOL-DEMO-LD-03.pdf',
  428160,
  'bill_of_lading',
  'complete',
  (SELECT "id" FROM "drivers" WHERE "driver_code" = 'DEMO-DR-01'),
  (SELECT "id" FROM "loads" WHERE "reference_number" = 'DEMO-LD-03'),
  '2026-06-09T06:42:00Z'
),
(
  '80000000-0000-4000-8000-000000000002',
  'POD-DEMO-LD-02.pdf',
  315392,
  'proof_of_delivery',
  'complete',
  (SELECT "id" FROM "drivers" WHERE "driver_code" = 'DEMO-DR-02'),
  (SELECT "id" FROM "loads" WHERE "reference_number" = 'DEMO-LD-02'),
  '2026-06-05T16:24:00Z'
),
(
  '80000000-0000-4000-8000-000000000003',
  'Rate-Confirmation-DEMO-LD-04.pdf',
  184320,
  'rate_confirmation',
  'processing',
  (SELECT "id" FROM "drivers" WHERE "driver_code" = 'DEMO-DR-02'),
  (SELECT "id" FROM "loads" WHERE "reference_number" = 'DEMO-LD-04'),
  '2026-06-09T12:55:00Z'
),
(
  '80000000-0000-4000-8000-000000000004',
  'Marcus-Johnson-CDL.pdf',
  247808,
  'driver_license',
  'needs_review',
  (SELECT "id" FROM "drivers" WHERE "driver_code" = 'DEMO-DR-01'),
  NULL,
  '2026-05-18T11:00:00Z'
)
ON CONFLICT ("id") DO UPDATE SET
  "file_name" = EXCLUDED."file_name",
  "file_size" = EXCLUDED."file_size",
  "type" = EXCLUDED."type",
  "status" = EXCLUDED."status",
  "driver_id" = EXCLUDED."driver_id",
  "load_id" = EXCLUDED."load_id",
  "uploaded_at" = EXCLUDED."uploaded_at",
  "updated_at" = NOW();

INSERT INTO "incidents" (
  "id", "load_id", "title", "description", "location", "type", "priority",
  "status", "occurred_at", "resolved_at", "timeline"
) VALUES
(
  '70000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000003',
  'Unexpected tire pressure loss',
  'The driver reported a rapid pressure drop in the rear passenger-side tire.',
  'I-94 near Chicago, IL',
  'flat_tire',
  'high',
  'investigating',
  '2026-06-09T12:18:00Z',
  NULL,
  '[{"id":"tire-detected","dateTime":"2026-06-09T12:18:00Z","title":"Pressure alert detected","description":"Telematics reported a rapid tire pressure drop.","type":"Detection","tone":"blue"},{"id":"tire-driver","dateTime":"2026-06-09T12:22:00Z","title":"Driver contacted","description":"Marcus confirmed the truck was moved to a safe shoulder.","type":"Action","tone":"blue"}]'
),
(
  '70000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000004',
  'Pickup delay risk',
  'Traffic congestion may delay arrival at the Seattle pickup appointment.',
  'Seattle, WA',
  'delay',
  'medium',
  'monitoring',
  '2026-06-10T08:35:00Z',
  NULL,
  '[{"id":"delay-route","dateTime":"2026-06-10T08:35:00Z","title":"Route delay detected","description":"Current traffic adds approximately 35 minutes to the route.","type":"Detection","tone":"blue"},{"id":"delay-broker","dateTime":"2026-06-10T08:42:00Z","title":"Broker notified","description":"Pacific Route Partners received the revised ETA.","type":"Update","tone":"green"}]'
),
(
  '70000000-0000-4000-8000-000000000003',
  '50000000-0000-4000-8000-000000000001',
  'Minor loading dock accident',
  'The trailer made contact with a dock barrier. No injuries were reported.',
  'Detroit receiving dock',
  'accident',
  'critical',
  'resolved',
  '2026-06-02T09:05:00Z',
  '2026-06-02T11:30:00Z',
  '[{"id":"accident-reported","dateTime":"2026-06-02T09:05:00Z","title":"Accident reported","description":"Receiving staff reported contact with the dock barrier.","type":"Detection","tone":"red"},{"id":"accident-inspection","dateTime":"2026-06-02T09:25:00Z","title":"Vehicle inspected","description":"Inspection found cosmetic trailer damage only.","type":"Assessment","tone":"green"},{"id":"accident-resolved","dateTime":"2026-06-02T11:30:00Z","title":"Incident resolved","description":"Documentation was completed and the load was released.","type":"Action","tone":"green"}]'
),
(
  '70000000-0000-4000-8000-000000000004',
  '50000000-0000-4000-8000-000000000002',
  'Low fuel warning',
  'Fuel level fell below the planned reserve before the Houston delivery.',
  'I-45 near Huntsville, TX',
  'fuel_issue',
  'low',
  'closed',
  '2026-06-05T13:10:00Z',
  '2026-06-05T13:45:00Z',
  '[{"id":"fuel-warning","dateTime":"2026-06-05T13:10:00Z","title":"Low fuel warning","description":"Telematics reported fuel below the reserve threshold.","type":"Detection","tone":"blue"},{"id":"fuel-stop","dateTime":"2026-06-05T13:45:00Z","title":"Fuel stop completed","description":"The driver refueled and resumed the route.","type":"Action","tone":"green"}]'
),
(
  '70000000-0000-4000-8000-000000000005',
  '50000000-0000-4000-8000-000000000004',
  'Preventive maintenance inspection',
  'A brake wear alert requires inspection before the next long-haul assignment.',
  'Portland, OR service area',
  'maintenance',
  'high',
  'open',
  '2026-06-10T10:15:00Z',
  NULL,
  '[{"id":"maintenance-alert","dateTime":"2026-06-10T10:15:00Z","title":"Brake wear alert","description":"The maintenance system flagged the front brake pads for inspection.","type":"Detection","tone":"red"},{"id":"maintenance-scheduled","dateTime":"2026-06-10T10:28:00Z","title":"Inspection scheduled","description":"A service appointment was requested in Portland.","type":"Action","tone":"blue"}]'
)
ON CONFLICT ("id") DO UPDATE SET
  "load_id" = EXCLUDED."load_id",
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "location" = EXCLUDED."location",
  "type" = EXCLUDED."type",
  "priority" = EXCLUDED."priority",
  "status" = EXCLUDED."status",
  "occurred_at" = EXCLUDED."occurred_at",
  "resolved_at" = EXCLUDED."resolved_at",
  "timeline" = EXCLUDED."timeline",
  "updated_at" = NOW();

INSERT INTO "driver_activity" (
  "id", "driver_id", "type", "description", "created_at"
) VALUES
('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'trip_assigned', 'Assigned to load DEMO-LD-03', '2026-06-07T15:20:00Z'),
('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'document_added', 'DOT Medical Certificate added', '2026-05-18T11:00:00Z'),
('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'trip_completed', 'Completed load DEMO-LD-02', '2026-06-05T16:45:00Z')
ON CONFLICT DO NOTHING;

WITH bulk_driver_seed AS (
  SELECT
    n,
    (ARRAY['Arthur','Olivia','Liam','Emma','Noah','Ava','Elijah','Sophia','Mateo','Mia','Lucas','Amelia','Mason','Harper','Logan','Evelyn','James','Abigail','Benjamin','Ella'])[((n - 1) % 20) + 1] AS first_name,
    (ARRAY['Prydatko','Johnson','Rodriguez','Kim','Davis','Martinez','Clark','Lewis','Walker','Hall','Allen','Young','King','Wright','Scott','Green','Baker','Adams','Nelson','Carter'])[(((n - 1) * 3) % 20) + 1] AS last_name,
    (ARRAY['Texas','Illinois','Georgia','Florida','Colorado','Washington','Ohio','Arizona','Tennessee','North Carolina'])[(((n - 1)) % 10) + 1] AS license_state,
    (ARRAY['Dallas, TX','Chicago, IL','Atlanta, GA','Miami, FL','Denver, CO','Seattle, WA','Cleveland, OH','Phoenix, AZ','Nashville, TN','Charlotte, NC'])[(((n - 1)) % 10) + 1] AS address,
    (ARRAY['available','on_trip','off_duty','maintenance'])[(((n - 1)) % 4) + 1]::driver_status AS status
  FROM generate_series(1, 10) AS gs(n)
)
INSERT INTO "drivers" (
  "id", "driver_code", "first_name", "last_name", "email", "phone",
  "date_of_birth", "address", "hire_date", "license_type", "license_number",
  "license_expiration_date", "license_state", "emergency_contact",
  "emergency_phone", "notes", "truck_number", "trailer_number",
  "status", "rating", "is_active"
)
SELECT
  ('11000000-0000-4000-8000-' || lpad((1000 + n)::text, 12, '0'))::uuid,
  'ID-' || (3023 + n)::text,
  first_name,
  last_name,
  'bulk.' || lower(first_name) || '.' || lower(last_name) || '.' || n::text || '@example.com',
  '+1' || lpad((5550000000 + n)::text, 10, '0'),
  (DATE '1983-01-01' + ((n - 1) * 117))::date,
  address,
  (DATE '2021-01-01' + ((n - 1) * 19))::date,
  'CDL-A',
  upper(left(license_state, 2)) || '-' || (700000 + n - 1)::text,
  (DATE '2027-01-01' + ((n - 1) * 11))::date,
  license_state,
  first_name || ' Contact',
  '+1' || lpad((5550000000 + n + 8)::text, 10, '0'),
  initcap(replace(status::text, '_', ' ')) || ' driver in demo bulk seed batch ' || (((n - 1) / 10) + 1)::text || '.',
  CASE
    WHEN status <> 'off_duty' OR n % 3 = 1 THEN 'TR-' || (3023 + n)::text
    ELSE NULL
  END,
  CASE
    WHEN (status <> 'off_duty' OR n % 3 = 1) AND n % 2 = 1 THEN 'TL-' || (3023 + n)::text
    ELSE NULL
  END,
  status,
  (4.2 + ((n - 1) % 7) * 0.1)::numeric(2, 1),
  CASE
    WHEN status = 'off_duty' AND n % 7 = 0 THEN false
    ELSE true
  END
FROM bulk_driver_seed
ON CONFLICT ("id") DO UPDATE SET
  "driver_code" = EXCLUDED."driver_code",
  "first_name" = EXCLUDED."first_name",
  "last_name" = EXCLUDED."last_name",
  "email" = EXCLUDED."email",
  "phone" = EXCLUDED."phone",
  "date_of_birth" = EXCLUDED."date_of_birth",
  "address" = EXCLUDED."address",
  "hire_date" = EXCLUDED."hire_date",
  "license_type" = EXCLUDED."license_type",
  "license_number" = EXCLUDED."license_number",
  "license_expiration_date" = EXCLUDED."license_expiration_date",
  "license_state" = EXCLUDED."license_state",
  "emergency_contact" = EXCLUDED."emergency_contact",
  "emergency_phone" = EXCLUDED."emergency_phone",
  "notes" = EXCLUDED."notes",
  "truck_number" = EXCLUDED."truck_number",
  "trailer_number" = EXCLUDED."trailer_number",
  "status" = EXCLUDED."status",
  "rating" = EXCLUDED."rating",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = NOW();

WITH bulk_vehicle_seed AS (
  SELECT
    "truck_number",
    "license_state",
    "status",
    row_number() OVER (ORDER BY "id")::int AS n
  FROM "drivers"
  WHERE "id"::text LIKE '11000000-0000-4000-8000-%'
    AND "truck_number" IS NOT NULL
)
INSERT INTO "vehicles" (
  "id", "unit_number", "type", "image_url", "make", "model", "year", "vin",
  "license_plate", "license_state", "odometer_miles", "status", "last_service_at", "next_service_at"
)
SELECT
  ('22000000-0000-4000-8000-' || lpad((2000 + n)::text, 12, '0'))::uuid,
  "truck_number",
  'truck',
  NULL,
  'Freightliner',
  'Cascadia',
  2021 + ((n - 1) % 4),
  'B' || lpad((2000 + n)::text, 16, '0'),
  upper(left("license_state", 2)) || ' ' || (2000 + n)::text,
  "license_state",
  150000 + ((n - 1) * 3200),
  CASE WHEN "status" = 'maintenance' THEN 'maintenance' ELSE 'active' END::vehicle_status,
  (DATE '2026-01-01' + (n - 1))::date,
  (DATE '2026-04-01' + (n - 1))::date
FROM bulk_vehicle_seed
ON CONFLICT ("unit_number") DO UPDATE SET
  "make" = EXCLUDED."make",
  "model" = EXCLUDED."model",
  "year" = EXCLUDED."year",
  "vin" = EXCLUDED."vin",
  "license_plate" = EXCLUDED."license_plate",
  "license_state" = EXCLUDED."license_state",
  "odometer_miles" = EXCLUDED."odometer_miles",
  "status" = EXCLUDED."status",
  "last_service_at" = EXCLUDED."last_service_at",
  "next_service_at" = EXCLUDED."next_service_at",
  "updated_at" = NOW();

INSERT INTO "driver_vehicle_assignments" (
  "id", "driver_id", "vehicle_id", "assigned_at", "is_primary"
)
SELECT
  ('33000000-0000-4000-8000-' || lpad((3000 + row_number() OVER (ORDER BY d.id))::text, 12, '0'))::uuid,
  d."id",
  v."id",
  ('2026-01-01T09:00:00Z'::timestamptz + ((row_number() OVER (ORDER BY d.id) - 1) * INTERVAL '1 day')),
  true
FROM "drivers" AS d
INNER JOIN "vehicles" AS v
  ON v."unit_number" = d."truck_number"
WHERE d."id"::text LIKE '11000000-0000-4000-8000-%'
ON CONFLICT DO NOTHING;

WITH bulk_driver_docs AS (
  SELECT
    d."id" AS driver_id,
    d."driver_code",
    row_number() OVER (ORDER BY d."id")::int AS n
  FROM "drivers" AS d
  WHERE d."id"::text LIKE '11000000-0000-4000-8000-%'
)
INSERT INTO "driver_documents" (
  "id", "driver_id", "type", "name", "document_number",
  "file_url", "storage_key", "mime_type", "file_size",
  "issued_at", "expires_at"
)
SELECT
  ('44000000-0000-4000-8000-' || lpad((4000 + (n * 10) + doc_index)::text, 12, '0'))::uuid,
  driver_id,
  CASE WHEN doc_index = 0 THEN 'license' ELSE 'medical_card' END::driver_document_type,
  CASE WHEN doc_index = 0 THEN 'Commercial Driver License' ELSE 'DOT Medical Certificate' END,
  driver_code || CASE WHEN doc_index = 0 THEN '-LIC' ELSE '-MED' END,
  NULL,
  NULL,
  NULL,
  NULL,
  (DATE '2024-01-01' + ((n - 1) * 5) + ((doc_index::int) * 20))::date,
  (DATE '2027-01-01' + ((n - 1) * 9) + ((doc_index::int) * 40))::date
FROM bulk_driver_docs
CROSS JOIN generate_series(0, 1) AS doc_index
WHERE doc_index = 0 OR n % 3 = 1
ON CONFLICT DO NOTHING;

WITH bulk_load_seed AS (
  SELECT
    n,
    (ARRAY['Dallas, TX','Chicago, IL','Atlanta, GA','Denver, CO','Seattle, WA','Phoenix, AZ','Nashville, TN','Cleveland, OH','Kansas City, MO','Indianapolis, IN'])[(((n - 1)) % 10) + 1] AS pickup_address,
    (ARRAY['Houston, TX','Detroit, MI','Miami, FL','Salt Lake City, UT','Portland, OR','Las Vegas, NV','Charlotte, NC','Pittsburgh, PA','St. Louis, MO','Columbus, OH'])[(((n - 1)) % 10) + 1] AS delivery_address,
    (ARRAY[32.7767,41.8781,33.7490,39.7392,47.6062,33.4484,36.1627,41.4993,39.0997,39.7684])[(((n - 1)) % 10) + 1] AS pickup_latitude,
    (ARRAY[-96.7970,-87.6298,-84.3880,-104.9903,-122.3321,-112.0740,-86.7816,-81.6944,-94.5786,-86.1581])[(((n - 1)) % 10) + 1] AS pickup_longitude,
    (ARRAY[29.7604,42.3314,25.7617,40.7608,45.5152,36.1699,35.2271,40.4406,38.6270,39.9612])[(((n - 1)) % 10) + 1] AS delivery_latitude,
    (ARRAY[-95.3698,-83.0458,-80.1918,-111.8910,-122.6784,-115.1398,-80.8431,-79.9959,-90.1994,-82.9988])[(((n - 1)) % 10) + 1] AS delivery_longitude,
    (ARRAY[239,283,662,518,174,297,409,133,248,176])[(((n - 1)) % 10) + 1] AS miles,
    (ARRAY['pending','assigned','in_transit','delivered','cancelled'])[(((n - 1)) % 5) + 1]::load_status AS status,
    (ARRAY['broker-bulk-1','broker-bulk-2','broker-bulk-3','broker-bulk-4','broker-bulk-5'])[(((n - 1)) % 5) + 1] AS broker_id,
    (ARRAY['Northstar Freight','Lone Star Cargo','Pacific Route Partners','Mountain West Brokerage','Southeast Freight Desk'])[(((n - 1)) % 5) + 1] AS broker_name,
    (ARRAY['+13125550190','+12145550191','+12065550192','+13035550193','+14045550194'])[(((n - 1)) % 5) + 1] AS broker_phone
  FROM generate_series(1, 30) AS gs(n)
)
INSERT INTO "loads" (
  "id", "reference_number", "pickup_address", "delivery_address", "pickup_date",
  "delivery_date", "weight", "price", "miles", "status", "broker", "route_points",
  "timeline", "driver_id"
)
SELECT
  ('55000000-0000-4000-8000-' || lpad((5000 + n)::text, 12, '0'))::uuid,
  'BULK-LD-' || lpad(n::text, 3, '0'),
  pickup_address,
  delivery_address,
  ('2026-06-01T08:00:00Z'::timestamptz + ((n - 1) * INTERVAL '6 hours')),
  ('2026-06-01T08:00:00Z'::timestamptz + ((n - 1) * INTERVAL '6 hours') + (((miles / 45) + 4)::int * INTERVAL '1 hour')),
  18000 + (((n - 1) % 15) * 900),
  (1100 + (((n - 1) % 20) * 95))::numeric(12, 2),
  miles,
  status,
  jsonb_build_object('id', broker_id, 'companyName', broker_name, 'phone', broker_phone),
  jsonb_build_array(
    jsonb_build_object('label', pickup_address || ' pickup', 'latitude', pickup_latitude, 'longitude', pickup_longitude)
  )
  ||
  CASE
    WHEN n % 5 = 1 THEN jsonb_build_array(
      jsonb_build_object(
        'label', 'Fuel stop',
        'latitude', round(((pickup_latitude * 0.7 + delivery_latitude * 0.3))::numeric, 4),
        'longitude', round(((pickup_longitude * 0.7 + delivery_longitude * 0.3))::numeric, 4)
      ),
      jsonb_build_object(
        'label', 'Driver check-in',
        'latitude', round(((pickup_latitude * 0.4 + delivery_latitude * 0.6))::numeric, 4),
        'longitude', round(((pickup_longitude * 0.4 + delivery_longitude * 0.6))::numeric, 4)
      )
    )
    WHEN n % 5 = 2 THEN jsonb_build_array(
      jsonb_build_object(
        'label', 'Weigh station',
        'latitude', round(((pickup_latitude + delivery_latitude) / 2)::numeric, 4),
        'longitude', round(((pickup_longitude + delivery_longitude) / 2)::numeric, 4)
      )
    )
    WHEN n % 5 = 3 THEN jsonb_build_array(
      jsonb_build_object(
        'label', 'Rest area',
        'latitude', round(((pickup_latitude * 0.8 + delivery_latitude * 0.2))::numeric, 4),
        'longitude', round(((pickup_longitude * 0.8 + delivery_longitude * 0.2))::numeric, 4)
      ),
      jsonb_build_object(
        'label', 'Distribution hub',
        'latitude', round(((pickup_latitude * 0.55 + delivery_latitude * 0.45))::numeric, 4),
        'longitude', round(((pickup_longitude * 0.55 + delivery_longitude * 0.45))::numeric, 4)
      ),
      jsonb_build_object(
        'label', 'Final approach',
        'latitude', round(((pickup_latitude * 0.2 + delivery_latitude * 0.8))::numeric, 4),
        'longitude', round(((pickup_longitude * 0.2 + delivery_longitude * 0.8))::numeric, 4)
      )
    )
    ELSE '[]'::jsonb
  END
  ||
  jsonb_build_array(
    jsonb_build_object('label', delivery_address || ' delivery', 'latitude', delivery_latitude, 'longitude', delivery_longitude)
  ),
  jsonb_build_array(
    jsonb_build_object(
      'title', 'Load created',
      'description', 'Dispatch created BULK-LD-' || lpad(n::text, 3, '0'),
      'dateTime', to_char(('2026-06-01T08:00:00Z'::timestamptz + ((n - 1) * INTERVAL '6 hours')) AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')
    )
  ),
  CASE
    WHEN status = 'assigned'
      THEN ('11000000-0000-4000-8000-' || lpad((1000 + (((n - 1) % 10) + 1))::text, 12, '0'))::uuid
    WHEN status = 'in_transit'
      THEN ('11000000-0000-4000-8000-' || lpad((1000 + (((n + 2) % 10) + 1))::text, 12, '0'))::uuid
    WHEN status = 'delivered'
      THEN ('11000000-0000-4000-8000-' || lpad((1000 + (((n + 5) % 10) + 1))::text, 12, '0'))::uuid
    ELSE NULL
  END
FROM bulk_load_seed
ON CONFLICT ("id") DO UPDATE SET
  "reference_number" = EXCLUDED."reference_number",
  "pickup_address" = EXCLUDED."pickup_address",
  "delivery_address" = EXCLUDED."delivery_address",
  "pickup_date" = EXCLUDED."pickup_date",
  "delivery_date" = EXCLUDED."delivery_date",
  "weight" = EXCLUDED."weight",
  "price" = EXCLUDED."price",
  "miles" = EXCLUDED."miles",
  "status" = EXCLUDED."status",
  "broker" = EXCLUDED."broker",
  "route_points" = EXCLUDED."route_points",
  "timeline" = EXCLUDED."timeline",
  "driver_id" = EXCLUDED."driver_id",
  "updated_at" = NOW();

INSERT INTO "incidents" (
  "id", "load_id", "title", "description", "location", "photos", "timeline",
  "type", "priority", "status", "occurred_at", "resolved_at"
)
SELECT
  ('77000000-0000-4000-8000-' || lpad((7000 + n)::text, 12, '0'))::uuid,
  ('55000000-0000-4000-8000-' || lpad((5000 + (((n - 1) % 30) + 1))::text, 12, '0'))::uuid,
  (ARRAY['Flat tire alert','Route delay risk','Minor yard accident','Low fuel warning','Preventive maintenance alert','Driver check-in needed'])[(((n - 1)) % 6) + 1],
  (ARRAY[
    'Telematics flagged abnormal tire pressure during transit.',
    'Traffic or shipper timing may impact ETA.',
    'A low-speed contact event was reported with no injuries.',
    'Fuel reserve dropped below the planned threshold.',
    'A maintenance event needs review before the next long-haul move.',
    'Dispatch requested manual follow-up on a route exception.'
  ])[(((n - 1)) % 6) + 1],
  'Operations corridor',
  '[]'::jsonb,
  jsonb_build_array(
    jsonb_build_object(
      'id', 'bulk-' || n::text || '-1',
      'dateTime', to_char(('2026-06-03T09:30:00Z'::timestamptz + ((n - 1) * INTERVAL '11 hours')) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'title', 'Incident detected',
      'description', (ARRAY[
        'Telematics flagged abnormal tire pressure during transit.',
        'Traffic or shipper timing may impact ETA.',
        'A low-speed contact event was reported with no injuries.',
        'Fuel reserve dropped below the planned threshold.',
        'A maintenance event needs review before the next long-haul move.',
        'Dispatch requested manual follow-up on a route exception.'
      ])[(((n - 1)) % 6) + 1],
      'type', 'Detection',
      'tone', CASE
        WHEN (ARRAY['low','medium','high','critical'])[(((n - 1)) % 4) + 1] IN ('high', 'critical') THEN 'red'
        ELSE 'blue'
      END
    )
  ),
  (ARRAY['flat_tire','delay','accident','fuel_issue','maintenance','other'])[(((n - 1)) % 6) + 1]::incident_type,
  (ARRAY['low','medium','high','critical'])[(((n - 1)) % 4) + 1]::incident_priority,
  (ARRAY['open','investigating','monitoring','resolved','closed'])[(((n - 1)) % 5) + 1]::incident_status,
  ('2026-06-03T09:30:00Z'::timestamptz + ((n - 1) * INTERVAL '11 hours')),
  CASE
    WHEN (ARRAY['open','investigating','monitoring','resolved','closed'])[(((n - 1)) % 5) + 1] IN ('resolved', 'closed')
      THEN ('2026-06-03T09:30:00Z'::timestamptz + ((n - 1) * INTERVAL '11 hours') + INTERVAL '4 hours')
    ELSE NULL
  END
FROM generate_series(1, 45) AS gs(n)
ON CONFLICT ("id") DO UPDATE SET
  "load_id" = EXCLUDED."load_id",
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "location" = EXCLUDED."location",
  "photos" = EXCLUDED."photos",
  "timeline" = EXCLUDED."timeline",
  "type" = EXCLUDED."type",
  "priority" = EXCLUDED."priority",
  "status" = EXCLUDED."status",
  "occurred_at" = EXCLUDED."occurred_at",
  "resolved_at" = EXCLUDED."resolved_at",
  "updated_at" = NOW();

INSERT INTO "driver_activity" (
  "id", "driver_id", "type", "description", "created_at"
)
SELECT
  ('66000000-0000-4000-8000-' || lpad((6000 + n)::text, 12, '0'))::uuid,
  ('11000000-0000-4000-8000-' || lpad((1000 + n)::text, 12, '0'))::uuid,
  CASE
    WHEN n % 4 = 0 THEN 'vehicle_assigned'
    WHEN n % 4 = 1 THEN 'updated'
    WHEN n % 4 = 2 THEN 'trip_assigned'
    ELSE 'status_changed'
  END::driver_activity_type,
  CASE
    WHEN n % 4 = 0 THEN 'Assigned to truck TR-' || (3023 + n)::text
    WHEN n % 4 = 1 THEN 'Driver profile synced from bulk seed'
    WHEN n % 4 = 2 THEN 'Assigned to load BULK-LD-' || lpad((((n - 1) % 120) + 1)::text, 3, '0')
    ELSE 'Driver availability updated in bulk seed'
  END,
  ('2026-05-01T08:00:00Z'::timestamptz + ((n - 1) * INTERVAL '1 day'))
FROM generate_series(1, 10) AS gs(n)
ON CONFLICT DO NOTHING;
