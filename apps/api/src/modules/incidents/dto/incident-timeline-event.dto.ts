import { Transform } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class IncidentTimelineEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id!: string;

  @IsDateString()
  dateTime!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(trimString)
  title!: string;

  @IsString()
  @MaxLength(2000)
  @Transform(trimString)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trimString)
  type!: string;

  @IsIn(["blue", "green", "red"])
  tone!: "blue" | "green" | "red";
}
