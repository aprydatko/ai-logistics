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
  "delivery_date", "weight", "price", "miles", "status", "broker", "driver_id"
) VALUES
('50000000-0000-4000-8000-000000000001', 'DEMO-LD-01', 'Chicago, IL', 'Detroit, MI', '2026-05-28T14:30:00Z', '2026-05-29T10:00:00Z', 28000, 1850.00, 283, 'delivered', '{"id":"broker-demo-1","companyName":"Northstar Freight","phone":"+13125550901"}', '10000000-0000-4000-8000-000000000001'),
('50000000-0000-4000-8000-000000000002', 'DEMO-LD-02', 'Dallas, TX', 'Houston, TX', '2026-06-05T09:45:00Z', '2026-06-05T16:30:00Z', 19500, 1125.00, 239, 'delivered', '{"id":"broker-demo-2","companyName":"Lone Star Cargo","phone":"+12145550902"}', '10000000-0000-4000-8000-000000000002'),
('50000000-0000-4000-8000-000000000003', 'DEMO-LD-03', 'Milwaukee, WI', 'Cleveland, OH', '2026-06-08T07:00:00Z', '2026-06-09T15:00:00Z', 31000, 2240.00, 436, 'in_transit', '{"id":"broker-demo-1","companyName":"Northstar Freight","phone":"+13125550901"}', '10000000-0000-4000-8000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO "driver_activity" (
  "id", "driver_id", "type", "description", "created_at"
) VALUES
('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'trip_assigned', 'Assigned to load DEMO-LD-03', '2026-06-07T15:20:00Z'),
('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'document_added', 'DOT Medical Certificate added', '2026-05-18T11:00:00Z'),
('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'trip_completed', 'Completed load DEMO-LD-02', '2026-06-05T16:45:00Z')
ON CONFLICT DO NOTHING;
