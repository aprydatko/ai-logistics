import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import type { Server, Socket } from "socket.io";

import type { SocketTokenPayload } from "../auth/auth.types";
import type { IncidentTimelineResponse } from "./incidents.types";

type IncidentSocket = Socket & {
  data: {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  };
};

type TimelineRoomPayload = { incidentId: string };

@WebSocketGateway({
  cors: {
    credentials: true,
    origin: true,
  },
  namespace: "incidents",
})
export class IncidentsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Handles new WebSocket connections and authenticates clients.
   *
   * Extracts JWT token from handshake auth or Authorization header,
   * verifies it's a socket token, and attaches user data to the socket.
   * Disconnects clients with invalid or missing tokens.
   *
   * @param client - WebSocket client connection
   */
  async handleConnection(client: IncidentSocket): Promise<void> {
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<SocketTokenPayload>(token);

      if (payload.tokenType !== "socket" || !payload.sub) {
        client.disconnect();
        return;
      }

      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      client.disconnect();
    }
  }

  /**
   * Subscribes a client to a specific incident's timeline room.
   *
   * Clients must be authenticated (have user data) and provide a valid
   * incidentId. Joins the room to receive real-time timeline updates.
   *
   * @param client - Authenticated WebSocket client
   * @param payload - Payload containing incidentId to subscribe to
   */
  @SubscribeMessage("incident.subscribe")
  subscribeToIncident(
    @ConnectedSocket() client: IncidentSocket,
    @MessageBody() payload: TimelineRoomPayload,
  ): void {
    if (!client.data.user || !payload.incidentId) return;
    void client.join(this.toIncidentRoom(payload.incidentId));
  }

  /**
   * Emits a timeline update event to all clients subscribed to an incident.
   *
   * Broadcasts the updated timeline feed to the incident-specific room.
   * Called when an incident's timeline is modified.
   *
   * @param feed - Timeline feed data with incident metadata and sorted items
   */
  emitTimelineUpdated(feed: IncidentTimelineResponse["data"]): void {
    this.server
      .to(this.toIncidentRoom(feed.incidentId))
      .emit("incident.timeline.updated", feed);
  }

  /**
   * Emits a status update event to all clients subscribed to an incident.
   *
   * Broadcasts the updated status feed to the incident-specific room.
   * Called when an incident's status is changed.
   *
   * @param feed - Timeline feed data with incident metadata and sorted items
   */
  emitStatusUpdated(feed: IncidentTimelineResponse["data"]): void {
    this.server
      .to(this.toIncidentRoom(feed.incidentId))
      .emit("incident.status.updated", feed);
  }

  /**
   * Extracts JWT token from WebSocket handshake.
   *
   * First checks handshake.auth.token, then falls back to Authorization
   * header (Bearer token format). Returns undefined if no valid token found.
   *
   * @param client - WebSocket client connection
   * @returns JWT token string or undefined
   */
  private extractToken(client: Socket): string | undefined {
    const authToken =
      typeof client.handshake.auth.token === "string"
        ? client.handshake.auth.token
        : undefined;

    if (authToken) return authToken;

    const authorization = client.handshake.headers.authorization;
    const [type, token] = authorization?.split(" ") ?? [];

    return type === "Bearer" ? token : undefined;
  }

  /**
   * Generates a room name for an incident's timeline subscribers.
   *
   * @param incidentId - Incident UUID
   * @returns Room name in format "incident:{incidentId}"
   */
  private toIncidentRoom(incidentId: string): string {
    return `incident:${incidentId}`;
  }
}
