import { Transform, Type } from "class-transformer";
import {
  IsDateString,
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

export class ListIncidentsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trimOptionalString)
  search?: string;

  @IsOptional()
  @IsIn([
    "flat_tire",
    "delay",
    "accident",
    "fuel_issue",
    "maintenance",
    "other",
  ])
  type?:
    | "flat_tire"
    | "delay"
    | "accident"
    | "fuel_issue"
    | "maintenance"
    | "other";

  @IsOptional()
  @IsIn(["low", "medium", "high", "critical"])
  priority?: "low" | "medium" | "high" | "critical";

  @IsOptional()
  @IsIn(["open", "investigating", "monitoring", "resolved", "closed"])
  status?: "open" | "investigating" | "monitoring" | "resolved" | "closed";

  @IsOptional()
  @IsUUID()
  loadId?: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsDateString()
  occurredFrom?: string;

  @IsOptional()
  @IsDateString()
  occurredTo?: string;

  @IsOptional()
  @IsIn(["createdAt", "occurredAt", "priority", "title", "updatedAt"])
  sortBy: "createdAt" | "occurredAt" | "priority" | "title" | "updatedAt" =
    "occurredAt";

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
