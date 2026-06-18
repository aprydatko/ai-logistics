import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import type {
  Notification,
  NotificationUnreadCountResponse,
} from "@repo/shared/src";
import type { Server, Socket } from "socket.io";
import type { DocumentItem } from "../documents/documents.types";

import type { SocketTokenPayload } from "../auth/auth.types";

type RealtimeSocket = Socket & {
  data: {
    user?: {
      email: string;
      id: string;
      role: string;
    };
  };
};

@WebSocketGateway({
  cors: {
    credentials: true,
    origin: true,
  },
  namespace: "realtime",
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: RealtimeSocket): Promise<void> {
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

      await client.join(this.toUserRoom(payload.sub));
    } catch (error) {
      this.logger.warn("WebSocket connection failed: invalid token", error);
      client.disconnect();
    }
  }

  emitNotificationCreated(userId: string, notification: Notification): void {
    this.server
      .to(this.toUserRoom(userId))
      .emit("notification.created", notification);
  }

  emitNotificationRead(userId: string, notificationId: string): void {
    this.server
      .to(this.toUserRoom(userId))
      .emit("notification.read", { notificationId });
  }

  emitUnreadCountUpdated(userId: string, unreadCount: number): void {
    const payload: NotificationUnreadCountResponse["data"] = { unreadCount };
    this.server
      .to(this.toUserRoom(userId))
      .emit("notifications.unread-count.updated", payload);
  }

  emitDashboardIncidentStatsUpdated(userId: string): void {
    this.server
      .to(this.toUserRoom(userId))
      .emit("dashboard.incident-stats.updated", {
        timestamp: new Date().toISOString(),
      });
  }

  emitDocumentProcessingUpdated(userId: string, document: DocumentItem): void {
    this.server
      .to(this.toUserRoom(userId))
      .emit("document.processing.updated", { document });
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

  private toUserRoom(userId: string): string {
    return `user:${userId}`;
  }
}
