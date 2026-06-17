import type { DriverDetailsSummaryInput } from "./assistant.types";

export const toDriverDetailsSummary = (
  response: DriverDetailsSummaryInput,
): Record<string, unknown> => {
  const driver = response.data;
  return {
    id: driver.id,
    driverCode: driver.driverCode,
    firstName: driver.firstName,
    lastName: driver.lastName,
    status: driver.status,
    isActive: driver.isActive,
    truckNumber: driver.truckNumber,
    trailerNumber: driver.trailerNumber,
    currentVehicle: driver.currentVehicle
      ? {
          unitNumber: driver.currentVehicle.unitNumber,
          type: driver.currentVehicle.type,
          status: driver.currentVehicle.status,
          make: driver.currentVehicle.make,
          model: driver.currentVehicle.model,
          year: driver.currentVehicle.year,
          assignedAt: driver.currentVehicle.assignedAt,
        }
      : null,
    tripsHistory: driver.tripsHistory.slice(0, 3).map((trip) => ({
      id: trip.id,
      referenceNumber: trip.referenceNumber,
      status: trip.status,
      pickupAddress: trip.pickupAddress,
      deliveryAddress: trip.deliveryAddress,
      pickupDate: trip.pickupDate,
      deliveryDate: trip.deliveryDate,
    })),
    documents: driver.documents.slice(0, 5).map((document) => ({
      id: document.id,
      type: document.type,
      name: document.name,
      documentNumber: document.documentNumber,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      issuedAt: document.issuedAt,
      expiresAt: document.expiresAt,
    })),
    activity: driver.activity.slice(0, 5).map((entry) => ({
      id: entry.id,
      type: entry.type,
      description: entry.description,
      createdAt: entry.createdAt,
    })),
  };
};
