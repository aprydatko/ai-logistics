import { Transform, Type } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class BrokerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trimString)
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(trimString)
  companyName!: string;

  @IsPhoneNumber()
  @MaxLength(30)
  @Transform(trimString)
  phone!: string;
}

export class LoadRoutePointDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(trimString)
  label!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

export class LoadTimelineEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(trimString)
  title!: string;

  @IsString()
  @MaxLength(500)
  @Transform(trimString)
  description!: string;

  @IsDateString()
  dateTime!: string;
}

export class CreateLoadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trimString)
  referenceNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(trimString)
  pickupAddress!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(trimString)
  deliveryAddress!: string;

  @IsDateString()
  pickupDate!: string;

  @IsDateString()
  deliveryDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  weight!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  miles!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trimString)
  notes?: string;

  @IsOptional()
  @IsIn(["pending", "assigned", "in_transit", "delivered", "cancelled"])
  status?: "pending" | "assigned" | "in_transit" | "delivered" | "cancelled";

  @ValidateNested()
  @Type(() => BrokerDto)
  broker!: BrokerDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LoadRoutePointDto)
  routePoints?: LoadRoutePointDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LoadTimelineEventDto)
  timeline?: LoadTimelineEventDto[];

  @IsOptional()
  @IsUUID()
  driverId?: string;
}
