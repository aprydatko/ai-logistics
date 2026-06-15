import { Transform } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class UpdateDocumentExtractedFieldDto {
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  fieldKey!: string;

  @IsString()
  @MaxLength(160)
  @Transform(trimString)
  label!: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  rawValue?: string | null;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  normalizedValue?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  confidence?: number | null;

  @IsIn(["extracted", "edited", "confirmed", "rejected", "missing"])
  status!: "extracted" | "edited" | "confirmed" | "rejected" | "missing";
}
