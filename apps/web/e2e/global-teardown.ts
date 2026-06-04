import type { Server } from "node:http";

declare global {
  var __authMockServer: Server | undefined;
}

const globalTeardown = async (): Promise<void> => {
  if (!globalThis.__authMockServer) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    globalThis.__authMockServer?.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
  globalThis.__authMockServer = undefined;
};

export default globalTeardown;
