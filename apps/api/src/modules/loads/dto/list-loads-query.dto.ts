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

export class ListLoadsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimOptionalString)
  search?: string;

  @IsOptional()
  @IsIn(["pending", "assigned", "in_transit", "delivered", "cancelled"])
  status?: "pending" | "assigned" | "in_transit" | "delivered" | "cancelled";

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsDateString()
  pickupFrom?: string;

  @IsOptional()
  @IsDateString()
  pickupTo?: string;

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
