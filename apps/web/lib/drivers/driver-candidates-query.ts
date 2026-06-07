import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

const driverCandidateSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
});

const driverCandidatesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(driverCandidateSchema),
});

export type DriverCandidate = z.infer<typeof driverCandidateSchema>;

const fetchDriverCandidates = async (): Promise<DriverCandidate[]> => {
  const response = await fetch("/api/drivers/candidates");

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : "Unable to load available users";

    throw new Error(message);
  }

  const body: unknown = await response.json();
  const parsedResponse = driverCandidatesResponseSchema.safeParse(body);

  if (!parsedResponse.success) {
    throw new Error("The available users response has an invalid format");
  }

  return parsedResponse.data.data;
};

export const driverCandidatesQueryOptions = queryOptions({
  queryKey: ["driver-candidates"],
  queryFn: fetchDriverCandidates,
  staleTime: 30_000,
});
