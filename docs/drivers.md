# Drivers

## Driver Profiles

The web driver panel loads full profile details from `GET /api/drivers/:id`.
Only authenticated users with the `admin` or `dispatcher` role can access this
endpoint.

The response includes the driver record and:

- `rating`: numeric rating displayed on a five-point scale.
- `currentVehicle`: the active primary vehicle assignment, or `null`.
- `documents`: licenses, medical cards, insurance records, and other documents.
- `tripsHistory`: loads assigned to the driver, newest pickup first.
- `activity`: the 20 most recent driver activity entries.

The profile panel exposes Info, Truck, Docs, Trips, and Activity tabs.
Missing vehicle, document, trip, or activity data is shown as an empty state.
Documents are marked as expiring during the final 30 calendar days before
their expiration date.

Driver list search also matches driver codes. Ratings are returned by list,
create, update, and detail responses, but are server-managed and are not part
of create or update requests.

## Driver Assets

Administrators and dispatchers can manage a saved driver's truck and documents:

- `PUT /api/drivers/:id/vehicle` creates the driver's active primary truck or
  updates the currently assigned one. Truck numbers are normalized to uppercase,
  and saving the truck also updates the driver's `truckNumber`.
- `POST /api/drivers/:id/documents` uploads document metadata and file content.
- `DELETE /api/drivers/:id/documents/:documentId` removes a document belonging
  to the driver.

Truck records support unit number, type, make, model, year, license plate,
odometer mileage, status, last service date, and an optional image. Status must
be `active`, `maintenance`, or `inactive`. Truck images accept JPEG, PNG, or
WebP files up to 2 MB.

Documents can be licenses, medical cards, insurance records, or other files.
Uploads accept PDF, JPEG, PNG, or WebP files up to 5 MB, with optional document
number, issue date, and expiration date. Files and truck images are currently
stored as data URLs in the database.

Truck saves and document uploads add entries to driver activity. A new truck is
created only when the driver has no active primary assignment; later saves
update that assigned vehicle.

## Data Model

Driver profile data is stored in these tables:

- `drivers`: core driver data and rating.
- `vehicles`: vehicle identity, image, assignment, mileage, and service data.
- `driver_vehicle_assignments`: assignment history; each driver and vehicle can
  have at most one active primary assignment.
- `driver_documents`: document metadata and optional file information.
- `driver_activity`: typed activity entries with optional actor and metadata.

Deleting a driver cascades to their documents, vehicle assignments, and
activity. Deleting a vehicle cascades to its assignments.

## Demo Data

After applying migrations, `apps/api/seeds/demo.sql` can be run against the
local PostgreSQL database. It adds three demo drivers plus sample vehicles,
assignments, documents, loads, and activity. The statements use
`ON CONFLICT DO NOTHING`, so the seed can be applied again without duplicating
the fixed demo records.
