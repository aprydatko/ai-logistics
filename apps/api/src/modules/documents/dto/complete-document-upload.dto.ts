import { IsUUID } from "class-validator";

export class CompleteDocumentUploadDto {
  @IsUUID()
  uploadId!: string;
}
