export interface RequestContextStore {
  requestId: string;
  userId?: string;
}

export interface LogMeta {
  context?: string;
  durationMs?: number;
  environment?: string;
  errorName?: string;
  event?: string;
  method?: string;
  operation?: string;
  path?: string;
  provider?: string;
  providerRequestId?: string;
  requestId?: string;
  route?: string;
  stack?: string;
  statusCode?: number;
  userId?: string;
  [key: string]: unknown;
}
