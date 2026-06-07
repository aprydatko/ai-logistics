import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class UpdateDriverDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trimString)
  driverCode?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trimString)
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trimString)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Transform(trimString)
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  @MaxLength(30)
  @Transform(trimString)
  phone?: string;

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

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Transform(trimString)
  licenseType?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(trimString)
  licenseNumber?: string;

  @IsOptional()
  @IsDateString()
  licenseExpirationDate?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(trimString)
  licenseState?: string;

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
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trimString)
  truckNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trimString)
  trailerNumber?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(["available", "on_trip", "off_duty", "maintenance"])
  status?: "available" | "on_trip" | "off_duty" | "maintenance";
}
