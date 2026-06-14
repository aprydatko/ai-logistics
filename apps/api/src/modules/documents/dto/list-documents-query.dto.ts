import { Transform, Type } from "class-transformer";
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

const trimOptionalString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() || undefined : value;

export class ListDocumentsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimOptionalString)
  search?: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  loadId?: string;

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
  @IsIn(["uploadedAt", "fileName", "type", "status", "updatedAt"])
  sortBy: "uploadedAt" | "fileName" | "type" | "status" | "updatedAt" =
    "uploadedAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "desc";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
