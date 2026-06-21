import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import type { HelmetOptions } from "helmet";

const DEFAULT_WEB_ORIGIN = "http://localhost:3000";

export const resolveWebOrigin = (): string =>
  process.env.WEB_ORIGIN ?? DEFAULT_WEB_ORIGIN;

export const createCorsOptions = (): CorsOptions => ({
  credentials: true,
  origin: resolveWebOrigin(),
});

export const createHelmetOptions = (isProduction: boolean): HelmetOptions => ({
  contentSecurityPolicy: {
    directives: {
      "base-uri": ["'self'"],
      "connect-src": ["'self'"],
      "default-src": ["'self'"],
      "font-src": ["'self'", "data:"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "img-src": ["'self'", "data:", "blob:"],
      "object-src": ["'none'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "upgrade-insecure-requests": isProduction ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-site" },
  originAgentCluster: true,
  referrerPolicy: { policy: "no-referrer" },
  xContentTypeOptions: true,
  xDnsPrefetchControl: { allow: false },
  xDownloadOptions: true,
  xFrameOptions: { action: "deny" },
  xPermittedCrossDomainPolicies: { permittedPolicies: "none" },
});

export const websocketCorsOptions = createCorsOptions();
