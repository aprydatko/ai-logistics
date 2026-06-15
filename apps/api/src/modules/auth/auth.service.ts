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

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }
}
