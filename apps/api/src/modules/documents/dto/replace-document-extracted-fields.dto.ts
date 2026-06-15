import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  ValidateNested,
} from "class-validator";

import { UpdateDocumentExtractedFieldDto } from "./update-document-extracted-field.dto";

export class ReplaceDocumentExtractedFieldsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpdateDocumentExtractedFieldDto)
  fields!: UpdateDocumentExtractedFieldDto[];
}
