import type {
  AssistantResponseDto,
  CreateAssistantMessageDto,
} from '../assistant/dto/create-assistant-message.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { NotificationDeliveryInput } from '../notifications/notifications.types';

import type { BullMaxRetriesPerRequest } from './queue.constants';

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
  maxRetriesPerRequest: BullMaxRetriesPerRequest;
  password?: string;
  port: number;
  username?: string;
};
