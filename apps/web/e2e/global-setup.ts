/* eslint-disable turbo/no-undeclared-env-vars */
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { spawnSync } from "node:child_process";
import { once } from "node:events";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

declare global {
  var __authMockServer: Server | undefined;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AUTH_USER = {
  id: "user_1",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  role: "dispatcher",
  isActive: true,
  createdAt: "2026-06-04T10:00:00.000Z",
  updatedAt: "2026-06-04T10:00:00.000Z",
};

const readJsonBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return null;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    return null;
  }
};

const sendJson = (
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(body));
};

const handleAuthLogin = async (
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> => {
  const body = await readJsonBody(request);

  if (
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    "password" in body &&
    body.email === AUTH_USER.email &&
    body.password === "password123"
  ) {
    sendJson(response, 200, {
      accessToken: "e2e-access-token",
      refreshToken: "e2e-refresh-token",
      user: AUTH_USER,
    });
    return;
  }

  sendJson(response, 401, { message: "Invalid email or password" });
};

const globalSetup = async (): Promise<void> => {
  if (process.env.PLAYWRIGHT_REAL_API === "1") {
    const apiHealthUrl =
      process.env.PLAYWRIGHT_REAL_API_HEALTH_URL ??
      "http://127.0.0.1:3001/api/health";

    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const response = await fetch(apiHealthUrl, { cache: "no-store" });
        if (response.ok) {
          break;
        }
      } catch {
        // Retry while the local API is still starting up.
      }

      if (attempt === 19) {
        throw new Error(`Real API is unavailable at ${apiHealthUrl}`);
      }

      await new Promise((resolvePromise) => setTimeout(resolvePromise, 1_000));
    }

    const repoRoot = resolve(__dirname, "..", "..");
    const ensureUser = spawnSync(
      "pnpm",
      ["--filter", "api", "exec", "node", "scripts/ensure-e2e-dispatcher.mjs"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        shell: true,
      },
    );

    if (ensureUser.status !== 0) {
      throw new Error(
        ensureUser.stderr || ensureUser.stdout || "Failed to prepare E2E user",
      );
    }

    return;
  }

  const server = createServer((request, response) => {
    if (request.method === "POST" && request.url === "/api/auth/login") {
      void handleAuthLogin(request, response);
      return;
    }

    sendJson(response, 404, { message: "Not found" });
  });

  server.listen(3001, "127.0.0.1");
  await once(server, "listening");
  globalThis.__authMockServer = server;
};

export default globalSetup;
