import type { UserRecord } from "../../db/schema";

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRecord["role"];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRecord["role"];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRecord["role"];
  tokenType: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  tokenType: "refresh";
}
