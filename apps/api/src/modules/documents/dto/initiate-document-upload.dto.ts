import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return value;
};

export class InitiateDocumentUploadDto {
  @IsString()
  @Transform(trimString)
  fileName!: string;

  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024)
  fileSize!: number;

  @IsString()
  @Transform(trimString)
  mimeType!: string;

  @IsIn([
    "bill_of_lading",
    "proof_of_delivery",
    "rate_confirmation",
    "driver_license",
  ])
  @Transform(trimString)
  type!:
    | "bill_of_lading"
    | "proof_of_delivery"
    | "rate_confirmation"
    | "driver_license";

  @IsOptional()
  @IsUUID()
  @Transform(trimString)
  driverId?: string;

  @IsOptional()
  @IsUUID()
  @Transform(trimString)
  loadId?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  analyzeWithVision?: boolean = true;
}
