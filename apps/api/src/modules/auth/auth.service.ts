import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcrypt";
import { eq } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import { users, type UserRecord } from "../../db/schema";
import { LoginDto, RegisterDto } from "./dto";

const PASSWORD_SALT_ROUNDS = 12;

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

export interface LoginResponse {
  accessToken: string;
  user: PublicUser;
}

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRecord["role"];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
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

    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: this.toPublicUser(user),
    };
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
