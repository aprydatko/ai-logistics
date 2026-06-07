import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MaxLength,
  IsOptional,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trimString)
  driverCode!: string;

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

  @IsEmail()
  @MaxLength(255)
  @Transform(trimString)
  email!: string;

  @IsPhoneNumber()
  @MaxLength(30)
  @Transform(trimString)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  avatarUrl?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trimString)
  address?: string;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Transform(trimString)
  licenseType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(trimString)
  licenseNumber!: string;

  @IsDateString()
  licenseExpirationDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(trimString)
  licenseState!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trimString)
  emergencyContact?: string;

  @IsOptional()
  @IsPhoneNumber()
  @MaxLength(30)
  @Transform(trimString)
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trimString)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimString)
  truckNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimString)
  trailerNumber?: string;

  @IsBoolean()
  isActive!: boolean;

  @IsIn(["available", "on_trip", "off_duty", "maintenance"])
  status!: "available" | "on_trip" | "off_duty" | "maintenance";
}
