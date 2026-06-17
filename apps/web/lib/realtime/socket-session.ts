"use client";

import { io, type Socket } from "socket.io-client";
import { z } from "zod";

const socketSessionSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string(),
  socketUrl: z.string().url(),
});

export type SocketSession = z.infer<typeof socketSessionSchema>;

export const fetchSocketSession = async (): Promise<SocketSession> => {
  const response = await fetch("/api/realtime/socket-token", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to create realtime socket session");
  }

  return socketSessionSchema.parse(await response.json());
};

export const connectRealtimeNamespace = async (
  namespace: string,
): Promise<Socket> => {
  const session = await fetchSocketSession();

  return io(`${session.socketUrl}/${namespace}`, {
    auth: { token: session.token },
    path: "/socket.io",
    reconnection: true,
    transports: ["websocket"],
    withCredentials: true,
  });
};
