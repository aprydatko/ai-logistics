import {
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { compare, hash } from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Environment } from "../../config/environment";
import type { UserRecord } from "../../db/schema";
import { AuthService } from "./auth.service";

vi.mock("bcrypt", () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

interface QueryBuilderMock {
  from: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
}

interface DatabaseClientMock {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
}

const createdAt = new Date("2026-06-04T10:00:00.000Z");
const updatedAt = new Date("2026-06-04T11:00:00.000Z");

const userRecord: UserRecord = {
  id: "11111111-1111-1111-1111-111111111111",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  passwordHash: "hashed-password",
  role: "dispatcher",
  isActive: true,
  createdAt,
  updatedAt,
};

const createSelectChain = (result: unknown[]): QueryBuilderMock => {
  const chain = {
    from: vi.fn(),
    limit: vi.fn().mockResolvedValue(result),
    returning: vi.fn(),
    values: vi.fn(),
    where: vi.fn(),
  };

  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);

  return chain;
};

const createInsertChain = (result: unknown[]): QueryBuilderMock => {
  const chain = {
    from: vi.fn(),
    limit: vi.fn(),
    returning: vi.fn().mockResolvedValue(result),
    values: vi.fn(),
    where: vi.fn(),
  };

  chain.values.mockReturnValue(chain);

  return chain;
};

const createService = (
  databaseClient: DatabaseClientMock,
): {
  jwtService: {
    signAsync: ReturnType<typeof vi.fn>;
    verifyAsync: ReturnType<typeof vi.fn>;
  };
  service: AuthService;
} => {
  const jwtService = {
    signAsync: vi
      .fn()
      .mockResolvedValueOnce("access-token")
      .mockResolvedValueOnce("refresh-token"),
    verifyAsync: vi.fn(),
  };
  const configService = {
    get: vi.fn((key: keyof Environment) => {
      if (key === "JWT_REFRESH_SECRET") {
        return "refresh-secret";
      }

      if (key === "JWT_REFRESH_EXPIRES_IN") {
        return "7d";
      }

      return undefined;
    }),
  };
  const databaseService = {
    client: databaseClient,
  };

  return {
    jwtService,
    service: new AuthService(
      databaseService as unknown as ConstructorParameters<typeof AuthService>[0],
      jwtService as unknown as ConstructorParameters<typeof AuthService>[1],
      configService as unknown as ConstructorParameters<typeof AuthService>[2],
    ),
  };
};

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a user with normalized email and public fields", async () => {
    const selectChain = createSelectChain([]);
    const insertChain = createInsertChain([userRecord]);
    const databaseClient = {
      select: vi.fn().mockReturnValue(selectChain),
      insert: vi.fn().mockReturnValue(insertChain),
    };
    const { service } = createService(databaseClient);
    vi.mocked(hash).mockResolvedValue("hashed-password" as never);

    await expect(
      service.register({
        firstName: " Alex ",
        lastName: " Morgan ",
        email: " Alex.Morgan@Example.com ",
        password: "password123",
      }),
    ).resolves.toEqual({
      id: userRecord.id,
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      email: userRecord.email,
      role: userRecord.role,
      isActive: userRecord.isActive,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Alex",
        lastName: "Morgan",
        email: "alex.morgan@example.com",
        passwordHash: "hashed-password",
      }),
    );
  });

  it("rejects registration when the email already exists", async () => {
    const databaseClient = {
      select: vi.fn().mockReturnValue(createSelectChain([{ id: userRecord.id }])),
      insert: vi.fn(),
    };
    const { service } = createService(databaseClient);

    await expect(
      service.register({
        firstName: "Alex",
        lastName: "Morgan",
        email: "alex.morgan@example.com",
        password: "password123",
      }),
    ).rejects.toThrow(ConflictException);
    expect(databaseClient.insert).not.toHaveBeenCalled();
  });

  it("logs in an active user and returns tokens", async () => {
    const databaseClient = {
      select: vi.fn().mockReturnValue(createSelectChain([userRecord])),
      insert: vi.fn(),
    };
    const { jwtService, service } = createService(databaseClient);
    vi.mocked(compare).mockResolvedValue(true as never);

    await expect(
      service.login({
        email: " Alex.Morgan@Example.com ",
        password: "password123",
      }),
    ).resolves.toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: {
        id: userRecord.id,
        email: userRecord.email,
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
  });

  it("rejects login when the password is invalid", async () => {
    const databaseClient = {
      select: vi.fn().mockReturnValue(createSelectChain([userRecord])),
      insert: vi.fn(),
    };
    const { service } = createService(databaseClient);
    vi.mocked(compare).mockResolvedValue(false as never);

    await expect(
      service.login({
        email: "alex.morgan@example.com",
        password: "wrong-password",
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("rejects refresh tokens with the wrong token type", async () => {
    const databaseClient = {
      select: vi.fn(),
      insert: vi.fn(),
    };
    const { jwtService, service } = createService(databaseClient);
    jwtService.verifyAsync.mockResolvedValue({
      sub: userRecord.id,
      tokenType: "access",
    });

    await expect(
      service.refresh({ refreshToken: "access-token" }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
