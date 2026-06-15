import { Transform } from "class-transformer";
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class UpdateDocumentAuditEventDto {
  @IsIn(["uploaded", "ai_extraction", "load_link", "driver_link", "custom"])
  kind!: "uploaded" | "ai_extraction" | "load_link" | "driver_link" | "custom";

  @IsString()
  @MaxLength(255)
  @Transform(trimString)
  label!: string;

  @IsString()
  @MaxLength(160)
  @Transform(trimString)
  actor!: string;

  @IsString()
  @MaxLength(3)
  @Transform(trimString)
  actorBadge!: string;

  @IsString()
  @MaxLength(160)
  @Transform(trimString)
  role!: string;

  @IsIn(["green", "navy", "violet"])
  tone!: "green" | "navy" | "violet";

  @IsOptional()
  @IsISO8601()
  timestamp?: string | null;
}
