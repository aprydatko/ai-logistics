import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";

import { IncidentTimelineEventDto } from "./incident-timeline-event.dto";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class CreateIncidentDto {
  @IsUUID()
  loadId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(trimString)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  @Transform(trimString)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimString)
  location?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photos?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncidentTimelineEventDto)
  timeline?: IncidentTimelineEventDto[];

  @IsIn([
    "flat_tire",
    "delay",
    "accident",
    "fuel_issue",
    "maintenance",
    "other",
  ])
  type!:
    | "flat_tire"
    | "delay"
    | "accident"
    | "fuel_issue"
    | "maintenance"
    | "other";

  @IsIn(["low", "medium", "high", "critical"])
  priority!: "low" | "medium" | "high" | "critical";

  @IsOptional()
  @IsIn(["open", "investigating", "monitoring", "resolved", "closed"])
  status?: "open" | "investigating" | "monitoring" | "resolved" | "closed";

  @IsDateString()
  occurredAt!: string;
}
