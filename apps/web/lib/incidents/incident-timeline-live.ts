"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { z } from "zod";

import {
  incidentTimelineQueryOptions,
  type IncidentTimelineFeed,
} from "./incidents-query";

const socketSessionSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string(),
  socketUrl: z.string().url(),
});

const fetchSocketSession = async (): Promise<
  z.infer<typeof socketSessionSchema>
> => {
  const response = await fetch("/api/realtime/socket-token", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to create realtime socket session");
  }

  return socketSessionSchema.parse(await response.json());
};

const applyTimelineFeed = (
  current: IncidentTimelineFeed | undefined,
  feed: IncidentTimelineFeed,
): IncidentTimelineFeed => ({
  ...current,
  ...feed,
});

export type IncidentTimelineLiveState =
  | "idle"
  | "connecting"
  | "connected"
  | "polling";

export const useIncidentTimelineLive = (
  incidentId: string | null,
  enabled = true,
): IncidentTimelineLiveState => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<IncidentTimelineLiveState>("idle");

  useEffect(() => {
    if (!incidentId || !enabled) {
      setState("idle");
      return;
    }

    let cancelled = false;
    let socket: ReturnType<typeof io> | null = null;
    setState("connecting");

    const connect = async (): Promise<void> => {
      try {
        const session = await fetchSocketSession();
        if (cancelled) return;

        socket = io(`${session.socketUrl}/incidents`, {
          auth: { token: session.token },
          transports: ["websocket"],
          withCredentials: true,
          path: "/socket.io",
          reconnection: true,
        });

        socket.on("connect", () => {
          setState("connected");
          socket?.emit("incident.subscribe", { incidentId });
        });

        const handleFeed = (feed: IncidentTimelineFeed): void => {
          queryClient.setQueryData(
            incidentTimelineQueryOptions(incidentId).queryKey,
            (current: IncidentTimelineFeed | undefined) =>
              applyTimelineFeed(current, feed),
          );
          void queryClient.invalidateQueries({ queryKey: ["incidents"] });
        };

        socket.on("incident.timeline.updated", handleFeed);
        socket.on("incident.status.updated", handleFeed);
        socket.on("disconnect", () => {
          if (!cancelled) setState("polling");
        });
        socket.on("connect_error", () => {
          if (!cancelled) setState("polling");
        });
      } catch {
        if (!cancelled) setState("polling");
      }
    };

    void connect();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [enabled, incidentId, queryClient]);

  return state;
};
