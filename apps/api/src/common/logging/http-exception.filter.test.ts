import {
  ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { HttpExceptionFilter } from "./http-exception.filter";
import type { SentryService } from "./sentry.service";
import type { WinstonLoggerService } from "./winston-logger.service";

const buildHost = (): {
  host: ArgumentsHost;
  request: Request;
  response: Response;
} => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const response = {
    getHeader: vi.fn().mockReturnValue("req-123"),
    headersSent: false,
    json,
    status,
  } as unknown as Response;
  const request = {
    headers: {},
    method: "GET",
    originalUrl: "/api/test",
    path: "/api/test",
    route: { path: "/test" },
  } as unknown as Request;

  return {
    host: {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost,
    request,
    response,
  };
};

describe("HttpExceptionFilter", () => {
  it("returns the http exception status and message", () => {
    const logger = {
      errorWithMeta: vi.fn(),
    } as unknown as WinstonLoggerService;
    const sentry = {
      captureException: vi.fn(),
    } as unknown as SentryService;
    const filter = new HttpExceptionFilter(logger, sentry);
    const { host, response } = buildHost();

    filter.catch(new BadRequestException("Bad input"), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.status(400).json).toHaveBeenCalledWith({
      message: "Bad input",
      requestId: "req-123",
      statusCode: 400,
    });
  });

  it("normalizes unknown errors to 500", () => {
    const logger = {
      errorWithMeta: vi.fn(),
    } as unknown as WinstonLoggerService;
    const sentry = {
      captureException: vi.fn(),
    } as unknown as SentryService;
    const filter = new HttpExceptionFilter(logger, sentry);
    const { host, response } = buildHost();

    filter.catch(new InternalServerErrorException(), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.status(500).json).toHaveBeenCalledWith({
      message: "Internal Server Error",
      requestId: "req-123",
      statusCode: 500,
    });
  });
});
