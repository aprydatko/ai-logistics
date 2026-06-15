import { Transform } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trimString)
  fileName?: string;

  @IsOptional()
  @IsString()
  @IsIn(["application/pdf", "image/jpeg", "image/png", "image/webp"])
  mimeType?: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  extractionModel?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageCount?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60 * 60 * 1000)
  processingTimeMs?: number | null;

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
