import type {
  AssistantResponseDto,
  CreateAssistantMessageDto,
} from "../assistant/dto/create-assistant-message.dto";
import type { AuthenticatedUser } from "../auth/auth.types";
import type { NotificationDeliveryInput } from "../notifications/notifications.types";

export type AssistantQueueJobData = {
  dto: CreateAssistantMessageDto;
  user: AuthenticatedUser;
};

export type AssistantQueueJobResult = AssistantResponseDto;

export type DocumentProcessingJobData = {
  documentId: string;
};

export type EmailNotificationJobData = NotificationDeliveryInput;

export type RedisConnectionOptions = {
  db?: number;
  host: string;
  maxRetriesPerRequest: null;
  password?: string;
  port: number;
  username?: string;
};
