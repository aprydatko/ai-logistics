import { Transform } from "class-transformer";
import {
  IsBase64,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class CreateDriverDocumentDto {
  @IsIn(["license", "medical_card", "insurance", "other"])
  type!: "license" | "medical_card" | "insurance" | "other";

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(trimString)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  documentNumber?: string;

  @IsString()
  @IsIn(["application/pdf", "image/jpeg", "image/png", "image/webp"])
  mimeType!: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";

  @IsBase64()
  @MaxLength(7_000_000)
  content!: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
