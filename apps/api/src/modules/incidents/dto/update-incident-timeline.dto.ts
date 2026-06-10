import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";

import { IncidentTimelineEventDto } from "./incident-timeline-event.dto";

export class UpdateIncidentTimelineDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncidentTimelineEventDto)
  timeline!: IncidentTimelineEventDto[];
}
