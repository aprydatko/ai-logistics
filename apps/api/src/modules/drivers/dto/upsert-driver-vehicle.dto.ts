import { Transform } from "class-transformer";
import {
  IsBase64,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class UpsertDriverVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trimString)
  unitNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trimString)
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  make?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(trimString)
  licensePlate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  odometerMiles?: number;

  @IsIn(["active", "maintenance", "inactive"])
  status!: "active" | "maintenance" | "inactive";

  @IsOptional()
  @IsDateString()
  lastServiceAt?: string;

  @IsOptional()
  @IsIn(["image/jpeg", "image/png", "image/webp"])
  imageMimeType?: "image/jpeg" | "image/png" | "image/webp";

  @IsOptional()
  @IsBase64()
  @MaxLength(3_000_000)
  imageContent?: string;
}
