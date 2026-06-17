import { JwtService } from '@nestjs/jwt';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import type { DatabaseService } from '../../db/database.service';
import type { AccessTokenPayload, AuthenticatedUser } from '../auth/auth.types';
import { QueueDashboardAuthService } from './queue-dashboard-auth.service';

const activeUser: AuthenticatedUser = {
  email: 'admin@example.com',
  id: '11111111-1111-1111-1111-111111111111',
  role: 'admin',
};

interface MockUserRow {
  email: string | null;
  id: string | null;
  isActive: boolean;
  role: string | null;
}

const buildDatabaseService = (rows: MockUserRow[]): DatabaseService => {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });

  return {
    client: { select } as unknown as DatabaseService['client'],
  } as DatabaseService;
};

const buildJwtService = (verifyImpl: (token: string) => unknown): JwtService =>
  ({
    verifyAsync: vi.fn().mockImplementation((token: string) => {
      try {
        return Promise.resolve(verifyImpl(token));
      } catch (error) {
        return Promise.reject(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }),
  }) as unknown as JwtService;

const buildMiddlewareContext = (headers: Record<string, string> = {}) => {
  const request = { headers } as unknown as Request;
  const response = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;

  return { next, request, response };
};

describe('QueueDashboardAuthService.createMiddleware', () => {
  it('calls next() when the request has a valid admin token and an active user', async () => {
    const jwtService = buildJwtService((token) => {
      expect(token).toBe('good-token');
      return {
        email: activeUser.email,
        role: activeUser.role,
        sub: activeUser.id,
        tokenType: 'access',
      } satisfies AccessTokenPayload;
    });
    const databaseService = buildDatabaseService([
      {
        email: activeUser.email,
        id: activeUser.id,
        isActive: true,
        role: activeUser.role,
      },
    ]);
    const service = new QueueDashboardAuthService(jwtService, databaseService);
    const { request, response, next } = buildMiddlewareContext({
      authorization: 'Bearer good-token',
    });

    await service.createMiddleware()(request, response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });

  it('responds 401 when no token is present', async () => {
    const jwtService = buildJwtService(() => null);
    const databaseService = buildDatabaseService([]);
    const service = new QueueDashboardAuthService(jwtService, databaseService);
    const { request, response, next } = buildMiddlewareContext();

    await service.createMiddleware()(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('responds 401 when the token is structurally invalid', async () => {
    const jwtService = buildJwtService(() => {
      throw new Error('jwt malformed');
    });
    const databaseService = buildDatabaseService([]);
    const service = new QueueDashboardAuthService(jwtService, databaseService);
    const { request, response, next } = buildMiddlewareContext({
      authorization: 'Bearer bad-token',
    });

    await service.createMiddleware()(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
  });

  it('responds 401 when the payload is not an access token', async () => {
    const jwtService = buildJwtService(() => ({
      sub: '11111111-1111-1111-1111-111111111111',
      tokenType: 'refresh',
    }));
    const databaseService = buildDatabaseService([]);
    const service = new QueueDashboardAuthService(jwtService, databaseService);
    const { request, response, next } = buildMiddlewareContext({
      authorization: 'Bearer refresh-token',
    });

    await service.createMiddleware()(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
  });

  it('responds 401 when the referenced user is not active', async () => {
    const jwtService = buildJwtService(() => ({
      email: activeUser.email,
      role: activeUser.role,
      sub: activeUser.id,
      tokenType: 'access',
    }));
    const databaseService = buildDatabaseService([
      {
        email: activeUser.email,
        id: activeUser.id,
        isActive: false,
        role: activeUser.role,
      },
    ]);
    const service = new QueueDashboardAuthService(jwtService, databaseService);
    const { request, response, next } = buildMiddlewareContext({
      authorization: 'Bearer good-token',
    });

    await service.createMiddleware()(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
  });

  it('responds 401 when the user role is outside the dashboard allow-list', async () => {
    const jwtService = buildJwtService(() => ({
      email: 'driver@example.com',
      role: 'driver',
      sub: '22222222-2222-2222-2222-222222222222',
      tokenType: 'access',
    }));
    const databaseService = buildDatabaseService([
      {
        email: 'driver@example.com',
        id: '22222222-2222-2222-2222-222222222222',
        isActive: true,
        role: 'driver',
      },
    ]);
    const service = new QueueDashboardAuthService(jwtService, databaseService);
    const { request, response, next } = buildMiddlewareContext({
      authorization: 'Bearer good-token',
    });

    await service.createMiddleware()(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
  });
});
