import { Transform, Type } from "class-transformer";
import {
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

export class ListAiLogsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimOptionalString)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(trimOptionalString)
  operation?: string;

  @IsOptional()
  @IsIn(["success", "failed"])
  status?: "success" | "failed";

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
