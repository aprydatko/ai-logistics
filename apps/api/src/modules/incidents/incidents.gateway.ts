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

  @SubscribeMessage("incident.subscribe")
  subscribeToIncident(
    @ConnectedSocket() client: IncidentSocket,
    @MessageBody() payload: TimelineRoomPayload,
  ): void {
    if (!client.data.user || !payload.incidentId) return;
    void client.join(this.toIncidentRoom(payload.incidentId));
  }

  emitTimelineUpdated(feed: IncidentTimelineResponse["data"]): void {
    this.server
      .to(this.toIncidentRoom(feed.incidentId))
      .emit("incident.timeline.updated", feed);
  }

  emitStatusUpdated(feed: IncidentTimelineResponse["data"]): void {
    this.server
      .to(this.toIncidentRoom(feed.incidentId))
      .emit("incident.status.updated", feed);
  }

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

  private toIncidentRoom(incidentId: string): string {
    return `incident:${incidentId}`;
  }
}
