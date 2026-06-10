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
