import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { WinstonLoggerService } from "../../common/logging/winston-logger.service";
import type { Environment } from "../../config/environment";
import type { NotificationDeliveryInput } from "./notifications.types";

/**
 * Validates an email address format using a simple regex.
 * This is a basic validation - for production use consider a more robust library
 * like validator.js or implementing RFC 5322 compliance.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

@Injectable()
export class NotificationsDeliveryService {
  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly logger: WinstonLoggerService,
  ) {}

  async sendNotificationEmail(input: NotificationDeliveryInput): Promise<void> {
    if (!input.channels.includes("email")) return;
    if (input.preference.emailFrequency !== "instant") return;

    if (!isValidEmail(input.recipient.email)) {
      this.logger.warnWithMeta("Invalid email address format", {
        context: NotificationsDeliveryService.name,
        event: "notification_email_invalid_recipient",
        userId: input.recipient.id,
      });
      return;
    }

    const apiKey = this.configService.get("RESEND_API_KEY", { infer: true });
    const from = this.configService.get("RESEND_FROM_EMAIL", { infer: true });

    if (!apiKey || !from) {
      this.logger.warnWithMeta("Email configuration missing", {
        context: NotificationsDeliveryService.name,
        event: "notification_email_config_missing",
        userId: input.recipient.id,
      });
      return;
    }

    const maxRetries = this.getPositiveIntegerConfig(
      "EMAIL_RETRY_MAX_ATTEMPTS",
      3,
    );
    const initialDelay = this.getPositiveIntegerConfig(
      "EMAIL_RETRY_INITIAL_DELAY_MS",
      1000,
    );

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
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
            html: this.renderEmailHtml(input),
          }),
        });

        if (!response.ok) {
          const body = await Promise.resolve(response.text()).catch(() => "");
          lastError = new Error(
            `Resend email failed: ${response.status} ${body}`,
          );

          if (attempt === maxRetries) {
            this.logger.errorWithMeta(
              "Email delivery failed after retries",
              lastError,
              {
                context: NotificationsDeliveryService.name,
                event: "notification_email_failed",
                statusCode: response.status,
                userId: input.recipient.id,
              },
            );
          } else {
            this.logger.warnWithMeta("Email delivery attempt failed", {
              context: NotificationsDeliveryService.name,
              event: "notification_email_retry",
              operation: `attempt_${attempt}_of_${maxRetries}`,
              statusCode: response.status,
              userId: input.recipient.id,
            });
            await this.delay(initialDelay * attempt);
          }
        } else {
          return;
        }
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxRetries) {
          this.logger.errorWithMeta(
            "Email delivery failed after retries",
            error,
            {
              context: NotificationsDeliveryService.name,
              event: "notification_email_failed",
              userId: input.recipient.id,
            },
          );
        } else {
          this.logger.warnWithMeta("Email delivery attempt errored", {
            context: NotificationsDeliveryService.name,
            event: "notification_email_retry_error",
            operation: `attempt_${attempt}_of_${maxRetries}`,
            userId: input.recipient.id,
          });
          await this.delay(initialDelay * attempt);
        }
      }
    }

    throw lastError || new Error("Email delivery failed");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getPositiveIntegerConfig(
    key: "EMAIL_RETRY_MAX_ATTEMPTS" | "EMAIL_RETRY_INITIAL_DELAY_MS",
    fallback: number,
  ): number {
    const value = this.configService.get(key, { infer: true });
    return typeof value === "number" && Number.isInteger(value) && value > 0
      ? value
      : fallback;
  }

  /**
   * Renders a tiny, safe HTML email body. Only the message body and an
   * optional deep-link are interpolated; both are HTML-escaped to keep
   * arbitrary notification text from injecting markup or links into
   * outbound emails.
   */
  private renderEmailHtml(input: NotificationDeliveryInput): string {
    const message = escapeHtml(input.notification.message);
    const cta = input.notification.href
      ? `<p><a href="${escapeHtml(input.notification.href)}">${escapeHtml(
          "Open in dashboard",
        )}</a></p>`
      : "";
    return `<div><p>${message}</p>${cta}</div>`;
  }
}

/**
 * Minimal HTML escaper for the five characters that can break out of a
 * text node or attribute value. Avoids pulling a full templating engine
 * into the API for what is intentionally a simple transactional email.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
