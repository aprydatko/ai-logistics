import { eq } from 'drizzle-orm';
import type { Request } from 'express';

import { isUserRole } from '../../common/roles';
import type { DatabaseService } from '../../db/database.service';
import { users } from '../../db/schema';
import type { AccessTokenPayload, AuthenticatedUser } from './auth.types';

const ACCESS_TOKEN_COOKIE = 'access_token';

export const extractAccessToken = (request: Request): string | undefined => {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  if (type === 'Bearer' && token) return token;

  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
    ?.slice(`${ACCESS_TOKEN_COOKIE}=`.length);
};

export const isAccessTokenPayload = (
  payload: unknown
): payload is AccessTokenPayload => {
  if (typeof payload !== 'object' || payload === null) return false;

  const candidate = payload as Partial<AccessTokenPayload>;

  return (
    candidate.tokenType === 'access' &&
    typeof candidate.sub === 'string' &&
    candidate.sub.length > 0 &&
    typeof candidate.email === 'string' &&
    isUserRole(candidate.role)
  );
};

export const findActiveUserById = async (
  databaseService: DatabaseService,
  userId: string
): Promise<AuthenticatedUser | undefined> => {
  const [user] = await databaseService.client
    .select({
      email: users.email,
      id: users.id,
      isActive: users.isActive,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.isActive) return undefined;

  return {
    email: user.email,
    id: user.id,
    role: user.role,
  };
};
