import { Type } from "class-transformer";
import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class AssignLoadDriverDto {
  @IsUUID()
  driverId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(35)
  @Max(75)
  averageSpeedMph = 55;
}
