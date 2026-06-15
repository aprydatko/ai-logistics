import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, ValidateNested } from "class-validator";

import { UpdateDocumentAuditEventDto } from "./update-document-audit-event.dto";

export class ReplaceDocumentAuditEventsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpdateDocumentAuditEventDto)
  events!: UpdateDocumentAuditEventDto[];
}
