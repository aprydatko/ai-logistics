import { IsIn, IsOptional, IsUUID } from "class-validator";

export class UpdateDocumentDto {
  @IsOptional()
  @IsIn([
    "bill_of_lading",
    "proof_of_delivery",
    "rate_confirmation",
    "driver_license",
  ])
  type?:
    | "bill_of_lading"
    | "proof_of_delivery"
    | "rate_confirmation"
    | "driver_license";

  @IsOptional()
  @IsIn(["complete", "processing", "needs_review"])
  status?: "complete" | "processing" | "needs_review";

  @IsOptional()
  @IsUUID()
  driverId?: string | null;

  @IsOptional()
  @IsUUID()
  loadId?: string | null;
}
