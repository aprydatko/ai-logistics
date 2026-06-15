import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

class LinkedEntityDto {
  @IsString()
  @MaxLength(80)
  @Transform(trimString)
  type!: string;

  @IsString()
  @MaxLength(120)
  @Transform(trimString)
  recordId!: string;

  @IsString()
  @MaxLength(200)
  @Transform(trimString)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trimString)
  route?: string;
}

export class CreateAiLogDto {
  @IsString()
  @MaxLength(160)
  @Transform(trimString)
  operation!: string;

  @IsString()
  @MaxLength(120)
  @Transform(trimString)
  model!: string;

  @IsIn(["success", "failed"])
  status!: "success" | "failed";

  @IsInt()
  @Min(0)
  latencyMs!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  promptTokens?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  completionTokens?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalTokens?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  estimatedCostUsd?: number;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  @MaxLength(200)
  @Transform(trimString)
  userName!: string;

  @IsIn(["web", "mobile", "api"])
  source!: "web" | "mobile" | "api";

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimString)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(trimString)
  providerRequestId?: string;

  @IsString()
  @MaxLength(20000)
  requestInput!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  responseOutput?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  errorMessage?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LinkedEntityDto)
  linkedEntity?: LinkedEntityDto;

  @IsOptional()
  @IsString()
  completedAt?: string;
}
