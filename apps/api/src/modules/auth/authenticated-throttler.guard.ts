import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

type AuthenticatedRequest = {
  headers?: {
    authorization?: string;
    "x-forwarded-for"?: string | string[];
  };
  ip?: string;
  ips?: string[];
  user?: {
    id: string;
  };
};

@Injectable()
export class AuthenticatedThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as AuthenticatedRequest;

    if (request.user?.id) {
      return `user:${request.user.id}`;
    }

    const forwardedFor = request.headers?.["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(",")[0];
    const ip = forwardedIp?.trim() || request.ip || request.ips?.[0];

    if (ip) {
      return `ip:${ip}`;
    }

    const authHeader = request.headers?.authorization?.trim();
    if (authHeader) {
      return `auth:${authHeader}`;
    }

    return "anonymous";
  }
}
