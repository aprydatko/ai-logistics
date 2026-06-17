"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { connectRealtimeNamespace } from "@/lib/realtime/socket-session";
import {
  incidentTimelineQueryOptions,
  type IncidentTimelineFeed,
} from "./incidents-query";

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
    let socket: Awaited<ReturnType<typeof connectRealtimeNamespace>> | null =
      null;
    setState("connecting");

    const connect = async (): Promise<void> => {
      try {
        socket = await connectRealtimeNamespace("incidents");
        if (cancelled) return;

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
