import { Transform } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(trimString)
  fileName!: string;

  @IsInt()
  @Min(0)
  @Max(5 * 1024 * 1024)
  fileSize!: number;

  @IsString()
  @IsIn(["application/pdf", "image/jpeg", "image/png", "image/webp"])
  mimeType!: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";

  @IsIn([
    "bill_of_lading",
    "proof_of_delivery",
    "rate_confirmation",
    "driver_license",
  ])
  type!:
    | "bill_of_lading"
    | "proof_of_delivery"
    | "rate_confirmation"
    | "driver_license";

  @IsIn(["complete", "processing", "needs_review"])
  status!: "complete" | "processing" | "needs_review";

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  loadId?: string;
}
