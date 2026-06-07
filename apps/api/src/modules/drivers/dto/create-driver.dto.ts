import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class CreateDriverDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trimString)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trimString)
  lastName!: string;

  @IsPhoneNumber()
  @MaxLength(30)
  @Transform(trimString)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trimString)
  truckNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trimString)
  trailerNumber!: string;

  @IsBoolean()
  isActive!: boolean;

  @IsIn(["available", "on_trip", "off_duty", "maintenance"])
  status!: "available" | "on_trip" | "off_duty" | "maintenance";
}
