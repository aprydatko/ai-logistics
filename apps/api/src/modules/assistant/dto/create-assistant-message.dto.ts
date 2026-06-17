import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class AssistantLinkedEntityDto {
  @IsIn(["load", "driver", "incident"])
  type!: "load" | "driver" | "incident";

  @IsString()
  @MaxLength(120)
  recordId!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  route?: string;
}

export class AssistantConversationMessageDto {
  @IsIn(["user", "assistant"])
  role!: "user" | "assistant";

  @IsString()
  @MaxLength(4000)
  text!: string;
}

export class AssistantAttachmentDto {
  @IsString()
  fileData!: string;

  @IsIn(["application/pdf", "image/jpeg", "image/png", "image/webp"])
  mimeType!: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";

  @IsString()
  @MaxLength(255)
  name!: string;
}

export class CreateAssistantMessageDto {
  @IsString()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AssistantLinkedEntityDto)
  linkedEntity?: AssistantLinkedEntityDto;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  operation?: string;

  @IsOptional()
  @IsIn(["web", "mobile", "api"])
  source?: "web" | "mobile" | "api";

  @IsOptional()
  @IsString()
  @MaxLength(120)
  conversationId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssistantConversationMessageDto)
  history?: AssistantConversationMessageDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AssistantAttachmentDto)
  attachment?: AssistantAttachmentDto | null;
}

type AssistantReportType =
  | "loads"
  | "drivers"
  | "incidents"
  | "operations"
  | "general";

type AssistantResultMetricTone = "amber" | "red" | "teal";

type AssistantLoadsTableMetric = {
  label: string;
  tone: AssistantResultMetricTone;
  value: string;
};

type AssistantLoadsTableRow = {
  deliveryDate: string;
  driverCode: string | null;
  driverInitials: string | null;
  driverName: string | null;
  id: string;
  pickupDate: string;
  referenceNumber: string;
  route: string;
  status: string;
};

type AssistantDriversTableRow = {
  driverCode: string;
  id: string;
  isActive: boolean;
  name: string;
  status: "available" | "on_trip" | "off_duty" | "maintenance";
  trailerNumber: string | null;
  truckNumber: string | null;
};

type AssistantLoadsResultView = {
  metrics: AssistantLoadsTableMetric[];
  rows: AssistantLoadsTableRow[];
  summary?: string;
  title: string;
  type: "loads_table";
};

type AssistantDriversResultView = {
  metrics: AssistantLoadsTableMetric[];
  rows: AssistantDriversTableRow[];
  summary?: string;
  title: string;
  type: "drivers_table";
};

type AssistantResultView =
  | AssistantLoadsResultView
  | AssistantDriversResultView;

type AssistantResponseStatus = "placeholder" | "configured" | "error";

export interface AssistantResponseDto {
  conversationId?: string;
  linkedEntity?: AssistantLinkedEntityDto;
  message: string;
  reportType?: AssistantReportType;
  resultView?: AssistantResultView;
  request?: {
    message: string;
    model: string;
  };
  status: AssistantResponseStatus;
  usedTools?: string[];
}
