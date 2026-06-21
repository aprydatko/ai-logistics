import type { ConfigService } from "@nestjs/config";
import { minutes } from "@nestjs/throttler";
import { z } from "zod";

import type { Environment } from "./environment";
import { rateLimitDefaults } from "./environment";

type RateLimitProfile = {
  limit: number;
  ttl: number;
};

type RateLimitEnvironment = {
  THROTTLE_ASSISTANT_JOBS_CREATE_LIMIT: number;
  THROTTLE_ASSISTANT_JOBS_CREATE_TTL_MINUTES: number;
  THROTTLE_ASSISTANT_RESPOND_LIMIT: number;
  THROTTLE_ASSISTANT_RESPOND_TTL_MINUTES: number;
  THROTTLE_AUTH_LOGIN_LIMIT: number;
  THROTTLE_AUTH_LOGIN_TTL_MINUTES: number;
  THROTTLE_AUTH_REFRESH_LIMIT: number;
  THROTTLE_AUTH_REFRESH_TTL_MINUTES: number;
  THROTTLE_AUTH_REGISTER_LIMIT: number;
  THROTTLE_AUTH_REGISTER_TTL_MINUTES: number;
  THROTTLE_AUTH_SOCKET_TOKEN_LIMIT: number;
  THROTTLE_AUTH_SOCKET_TOKEN_TTL_MINUTES: number;
  THROTTLE_DEFAULT_LIMIT: number;
  THROTTLE_DEFAULT_TTL_MINUTES: number;
  THROTTLE_DOCUMENTS_COMPLETE_UPLOAD_LIMIT: number;
  THROTTLE_DOCUMENTS_COMPLETE_UPLOAD_TTL_MINUTES: number;
  THROTTLE_DOCUMENTS_INITIATE_UPLOAD_LIMIT: number;
  THROTTLE_DOCUMENTS_INITIATE_UPLOAD_TTL_MINUTES: number;
  THROTTLE_DOCUMENTS_UPLOAD_LIMIT: number;
  THROTTLE_DOCUMENTS_UPLOAD_TTL_MINUTES: number;
};

export type RateLimitConfig = {
  assistantJobsCreate: RateLimitProfile;
  assistantRespond: RateLimitProfile;
  authLogin: RateLimitProfile;
  authRefresh: RateLimitProfile;
  authRegister: RateLimitProfile;
  authSocketToken: RateLimitProfile;
  default: RateLimitProfile;
  documentsCompleteUpload: RateLimitProfile;
  documentsInitiateUpload: RateLimitProfile;
  documentsUpload: RateLimitProfile;
};

const rateLimitEnvironmentSchema = z.object({
  THROTTLE_DEFAULT_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.defaultLimit),
  THROTTLE_DEFAULT_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.defaultTtlMinutes),
  THROTTLE_ASSISTANT_RESPOND_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.assistantRespondLimit),
  THROTTLE_ASSISTANT_RESPOND_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.assistantRespondTtlMinutes),
  THROTTLE_ASSISTANT_JOBS_CREATE_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.assistantJobsCreateLimit),
  THROTTLE_ASSISTANT_JOBS_CREATE_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.assistantJobsCreateTtlMinutes),
  THROTTLE_DOCUMENTS_UPLOAD_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.documentsUploadLimit),
  THROTTLE_DOCUMENTS_UPLOAD_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.documentsUploadTtlMinutes),
  THROTTLE_DOCUMENTS_INITIATE_UPLOAD_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.documentsInitiateUploadLimit),
  THROTTLE_DOCUMENTS_INITIATE_UPLOAD_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.documentsInitiateUploadTtlMinutes),
  THROTTLE_DOCUMENTS_COMPLETE_UPLOAD_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.documentsCompleteUploadLimit),
  THROTTLE_DOCUMENTS_COMPLETE_UPLOAD_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.documentsCompleteUploadTtlMinutes),
  THROTTLE_AUTH_REGISTER_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.authRegisterLimit),
  THROTTLE_AUTH_REGISTER_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.authRegisterTtlMinutes),
  THROTTLE_AUTH_LOGIN_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.authLoginLimit),
  THROTTLE_AUTH_LOGIN_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.authLoginTtlMinutes),
  THROTTLE_AUTH_REFRESH_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.authRefreshLimit),
  THROTTLE_AUTH_REFRESH_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.authRefreshTtlMinutes),
  THROTTLE_AUTH_SOCKET_TOKEN_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.authSocketTokenLimit),
  THROTTLE_AUTH_SOCKET_TOKEN_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(rateLimitDefaults.authSocketTokenTtlMinutes),
});

const createProfile = (
  limit: number,
  ttlMinutes: number,
): RateLimitProfile => ({
  limit,
  ttl: minutes(ttlMinutes),
});

export const createRateLimitConfig = (
  env: RateLimitEnvironment,
): RateLimitConfig => ({
  assistantJobsCreate: createProfile(
    env.THROTTLE_ASSISTANT_JOBS_CREATE_LIMIT,
    env.THROTTLE_ASSISTANT_JOBS_CREATE_TTL_MINUTES,
  ),
  assistantRespond: createProfile(
    env.THROTTLE_ASSISTANT_RESPOND_LIMIT,
    env.THROTTLE_ASSISTANT_RESPOND_TTL_MINUTES,
  ),
  authLogin: createProfile(
    env.THROTTLE_AUTH_LOGIN_LIMIT,
    env.THROTTLE_AUTH_LOGIN_TTL_MINUTES,
  ),
  authRefresh: createProfile(
    env.THROTTLE_AUTH_REFRESH_LIMIT,
    env.THROTTLE_AUTH_REFRESH_TTL_MINUTES,
  ),
  authRegister: createProfile(
    env.THROTTLE_AUTH_REGISTER_LIMIT,
    env.THROTTLE_AUTH_REGISTER_TTL_MINUTES,
  ),
  authSocketToken: createProfile(
    env.THROTTLE_AUTH_SOCKET_TOKEN_LIMIT,
    env.THROTTLE_AUTH_SOCKET_TOKEN_TTL_MINUTES,
  ),
  default: createProfile(
    env.THROTTLE_DEFAULT_LIMIT,
    env.THROTTLE_DEFAULT_TTL_MINUTES,
  ),
  documentsCompleteUpload: createProfile(
    env.THROTTLE_DOCUMENTS_COMPLETE_UPLOAD_LIMIT,
    env.THROTTLE_DOCUMENTS_COMPLETE_UPLOAD_TTL_MINUTES,
  ),
  documentsInitiateUpload: createProfile(
    env.THROTTLE_DOCUMENTS_INITIATE_UPLOAD_LIMIT,
    env.THROTTLE_DOCUMENTS_INITIATE_UPLOAD_TTL_MINUTES,
  ),
  documentsUpload: createProfile(
    env.THROTTLE_DOCUMENTS_UPLOAD_LIMIT,
    env.THROTTLE_DOCUMENTS_UPLOAD_TTL_MINUTES,
  ),
});

const readRateLimitEnvironmentFromConfig = (
  configService: ConfigService<Environment, true>,
): RateLimitEnvironment => ({
  THROTTLE_ASSISTANT_JOBS_CREATE_LIMIT: configService.get(
    "THROTTLE_ASSISTANT_JOBS_CREATE_LIMIT",
    { infer: true },
  ),
  THROTTLE_ASSISTANT_JOBS_CREATE_TTL_MINUTES: configService.get(
    "THROTTLE_ASSISTANT_JOBS_CREATE_TTL_MINUTES",
    { infer: true },
  ),
  THROTTLE_ASSISTANT_RESPOND_LIMIT: configService.get(
    "THROTTLE_ASSISTANT_RESPOND_LIMIT",
    { infer: true },
  ),
  THROTTLE_ASSISTANT_RESPOND_TTL_MINUTES: configService.get(
    "THROTTLE_ASSISTANT_RESPOND_TTL_MINUTES",
    { infer: true },
  ),
  THROTTLE_AUTH_LOGIN_LIMIT: configService.get("THROTTLE_AUTH_LOGIN_LIMIT", {
    infer: true,
  }),
  THROTTLE_AUTH_LOGIN_TTL_MINUTES: configService.get(
    "THROTTLE_AUTH_LOGIN_TTL_MINUTES",
    { infer: true },
  ),
  THROTTLE_AUTH_REFRESH_LIMIT: configService.get(
    "THROTTLE_AUTH_REFRESH_LIMIT",
    { infer: true },
  ),
  THROTTLE_AUTH_REFRESH_TTL_MINUTES: configService.get(
    "THROTTLE_AUTH_REFRESH_TTL_MINUTES",
    { infer: true },
  ),
  THROTTLE_AUTH_REGISTER_LIMIT: configService.get(
    "THROTTLE_AUTH_REGISTER_LIMIT",
    { infer: true },
  ),
  THROTTLE_AUTH_REGISTER_TTL_MINUTES: configService.get(
    "THROTTLE_AUTH_REGISTER_TTL_MINUTES",
    { infer: true },
  ),
  THROTTLE_AUTH_SOCKET_TOKEN_LIMIT: configService.get(
    "THROTTLE_AUTH_SOCKET_TOKEN_LIMIT",
    { infer: true },
  ),
  THROTTLE_AUTH_SOCKET_TOKEN_TTL_MINUTES: configService.get(
    "THROTTLE_AUTH_SOCKET_TOKEN_TTL_MINUTES",
    { infer: true },
  ),
  THROTTLE_DEFAULT_LIMIT: configService.get("THROTTLE_DEFAULT_LIMIT", {
    infer: true,
  }),
  THROTTLE_DEFAULT_TTL_MINUTES: configService.get(
    "THROTTLE_DEFAULT_TTL_MINUTES",
    { infer: true },
  ),
  THROTTLE_DOCUMENTS_COMPLETE_UPLOAD_LIMIT: configService.get(
    "THROTTLE_DOCUMENTS_COMPLETE_UPLOAD_LIMIT",
    { infer: true },
  ),
  THROTTLE_DOCUMENTS_COMPLETE_UPLOAD_TTL_MINUTES: configService.get(
    "THROTTLE_DOCUMENTS_COMPLETE_UPLOAD_TTL_MINUTES",
    { infer: true },
  ),
  THROTTLE_DOCUMENTS_INITIATE_UPLOAD_LIMIT: configService.get(
    "THROTTLE_DOCUMENTS_INITIATE_UPLOAD_LIMIT",
    { infer: true },
  ),
  THROTTLE_DOCUMENTS_INITIATE_UPLOAD_TTL_MINUTES: configService.get(
    "THROTTLE_DOCUMENTS_INITIATE_UPLOAD_TTL_MINUTES",
    { infer: true },
  ),
  THROTTLE_DOCUMENTS_UPLOAD_LIMIT: configService.get(
    "THROTTLE_DOCUMENTS_UPLOAD_LIMIT",
    { infer: true },
  ),
  THROTTLE_DOCUMENTS_UPLOAD_TTL_MINUTES: configService.get(
    "THROTTLE_DOCUMENTS_UPLOAD_TTL_MINUTES",
    { infer: true },
  ),
});

export const getRateLimitConfigFromConfig = (
  configService: ConfigService<Environment, true>,
): RateLimitConfig =>
  createRateLimitConfig(readRateLimitEnvironmentFromConfig(configService));

export const rateLimitConfig = createRateLimitConfig(
  rateLimitEnvironmentSchema.parse(process.env),
);
