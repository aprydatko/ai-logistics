import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Environment } from "../../config/environment";
import type { NotificationDeliveryInput } from "./notifications.types";

@Injectable()
export class NotificationsDeliveryService {
  private readonly logger = new Logger(NotificationsDeliveryService.name);

  constructor(
    private readonly configService: ConfigService<Environment, true>,
  ) {}

  async sendNotificationEmail(
    input: NotificationDeliveryInput,
  ): Promise<void> {
    if (!input.channels.includes("email")) return;
    if (input.preference.emailFrequency !== "instant") return;

    const apiKey = this.configService.get("RESEND_API_KEY", { infer: true });
    const from = this.configService.get("RESEND_FROM_EMAIL", { infer: true });

    if (!apiKey || !from) return;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.recipient.email],
        subject: input.notification.title,
        html: `
          <div>
            <p>${input.notification.message}</p>
            ${
              input.notification.href
                ? `<p><a href="${input.notification.href}">Open in dashboard</a></p>`
                : ""
            }
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      this.logger.warn(`Resend email failed: ${response.status} ${body}`);
    }
  }
}
