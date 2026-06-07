import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const trimOptionalString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() || undefined : value;

export class ListDriversQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimOptionalString)
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsIn(["available", "on_trip", "off_duty", "maintenance"])
  status?: "available" | "on_trip" | "off_duty" | "maintenance";

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimOptionalString)
  truckNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimOptionalString)
  trailerNumber?: string;

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
