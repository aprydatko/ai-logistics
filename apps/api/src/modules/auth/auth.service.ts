import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcrypt";
import { eq } from "drizzle-orm";

import type { Environment } from "../../config/environment";
import { DatabaseService } from "../../db/database.service";
import { users, type UserRecord } from "../../db/schema";
import type {
  AccessTokenPayload,
  AuthenticatedUser,
  LoginResponse,
  PublicUser,
  RefreshTokenPayload,
  SocketTokenResponse,
} from "./auth.types";
import { LoginDto, RefreshTokenDto, RegisterDto } from "./dto";

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Environment, true>,
  ) {}

  /**
   * Registers a new user account.
   *
   * Validates email uniqueness, hashes the password with bcrypt (12 rounds),
   * and creates a new user record. Normalizes email to lowercase and trims
   * whitespace from name fields.
   *
   * @param dto - User registration payload
   * @returns Created user without sensitive data
   * @throws ConflictException if email already exists
   * @throws InternalServerErrorException if database insert fails
   */
  async register(dto: RegisterDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();
    const [existingUser] = await this.databaseService.client
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new ConflictException("A user with this email already exists");
    }

    const passwordHash = await hash(dto.password, PASSWORD_SALT_ROUNDS);

    try {
      const [user] = await this.databaseService.client
        .insert(users)
        .values({
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email,
          passwordHash,
        })
        .returning();

      if (!user) {
        throw new InternalServerErrorException("Failed to create user");
      }

      return this.toPublicUser(user);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("A user with this email already exists");
      }

      throw error;
    }
  }

  /**
   * Authenticates a user and returns access/refresh tokens.
   *
   * Validates credentials using bcrypt comparison, checks account is active,
   * and generates JWT token pair. Uses generic error message for security
   * (doesn't reveal if email exists or password is wrong).
   *
   * @param dto - Login credentials
   * @returns Access token, refresh token, and user data
   * @throws UnauthorizedException if credentials are invalid or account is inactive
   */
  async login(dto: LoginDto): Promise<LoginResponse> {
    const email = dto.email.trim().toLowerCase();
    const [user] = await this.databaseService.client
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.createTokens(user);

    return {
      ...tokens,
      user: this.toPublicUser(user),
    };
  }

  /**
   * Refreshes access tokens using a valid refresh token.
   *
   * Verifies the refresh token signature and type, fetches the associated user,
   * checks account is active, and generates a new token pair.
   *
   * @param dto - Refresh token payload
   * @returns New access token, refresh token, and user data
   * @throws UnauthorizedException if refresh token is invalid or account is inactive
   */
  async refresh(dto: RefreshTokenDto): Promise<LoginResponse> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const [user] = await this.databaseService.client
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokens = await this.createTokens(user);

    return {
      ...tokens,
      user: this.toPublicUser(user),
    };
  }

  /**
   * Creates a short-lived JWT token for WebSocket authentication.
   *
   * Generates a token with 2-minute expiration for real-time connections.
   * Socket tokens include user identity and role for authorization.
   *
   * @param user - Authenticated user data
   * @returns Socket token and expiration timestamp
   */
  async createSocketToken(
    user: AuthenticatedUser,
  ): Promise<SocketTokenResponse> {
    const expiresInSeconds = 2 * 60;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tokenType: "socket",
      },
      { expiresIn: `${expiresInSeconds}s` },
    );

    return {
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Creates access and refresh JWT tokens for a user.
   *
   * Access token includes user identity and role for API authorization.
   * Refresh token only includes user ID for token renewal.
   * Uses separate secret and expiration for refresh tokens from config.
   *
   * @param user - User record from database
   * @returns Access and refresh token pair
   */
  private async createTokens(
    user: UserRecord,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: "access",
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      tokenType: "refresh",
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get("JWT_REFRESH_SECRET", { infer: true }),
        expiresIn: this.configService.get("JWT_REFRESH_EXPIRES_IN", {
          infer: true,
        }),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Verifies a refresh token and extracts its payload.
   *
   * Uses the refresh token secret from config. Validates the token type
   * is "refresh" and contains a subject (user ID).
   *
   * @param token - Refresh token to verify
   * @returns Refresh token payload with user ID
   * @throws UnauthorizedException if token is invalid or malformed
   */
  private async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret: this.configService.get("JWT_REFRESH_SECRET", { infer: true }),
        },
      );

      if (payload.tokenType !== "refresh" || !payload.sub) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  /**
   * Transforms a database UserRecord into a PublicUser response.
   *
   * Excludes sensitive fields (passwordHash) and converts Date fields
   * to ISO strings for API responses.
   *
   * @param user - Database user record
   * @returns Public user data without sensitive information
   */
  private toPublicUser(user: UserRecord): PublicUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Type guard to check if an error is a PostgreSQL unique violation.
   *
   * PostgreSQL returns error code 23505 for unique constraint violations.
   * This guard safely checks the error shape and code field.
   *
   * @param error - Unknown error object to check
   * @returns True if error is a PostgreSQL unique violation (code 23505)
   */
  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }
}
