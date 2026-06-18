import type { NextFunction, Request, Response } from "express";

import { REQUEST_ID_HEADER } from "./logging.constants";
import { resolveRequestId } from "./request-id";
import { RequestContextService } from "./request-context.service";

export const createRequestContextMiddleware =
  (requestContext: RequestContextService) =>
  (request: Request, response: Response, next: NextFunction): void => {
    const requestId = resolveRequestId(request.headers[REQUEST_ID_HEADER]);

    response.setHeader(REQUEST_ID_HEADER, requestId);

    requestContext.run({ requestId }, () => {
      next();
    });
  };
