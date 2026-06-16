import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

import type { Environment } from "../../config/environment";

type VisionExtractedField = {
  fieldKey: string;
  label: string;
  rawValue: string | null;
  normalizedValue: string | null;
  confidence: number | null;
  status: "extracted" | "missing";
};

export type DocumentVisionAnalysis = {
  extractionModel: string;
  extractedFields: VisionExtractedField[];
};

@Injectable()
export class DocumentVisionService {
  private readonly logger = new Logger(DocumentVisionService.name);
  private readonly openai: OpenAI | null;
  private readonly model: string;

  constructor(configService: ConfigService<Environment, true>) {
    const apiKey = configService.get("OPENAI_API_KEY", { infer: true });
    this.model = configService.get("OPENAI_DOCUMENT_MODEL", { infer: true });
    this.openai = apiKey ? new OpenAI({ apiKey }) : null;
  }

  get isEnabled(): boolean {
    return this.openai !== null;
  }

  async analyze(file: Express.Multer.File): Promise<DocumentVisionAnalysis | null> {
    if (!this.openai) return null;

    const content =
      file.mimetype === "application/pdf"
        ? [
            {
              type: "input_file" as const,
              filename: file.originalname,
              file_data: file.buffer.toString("base64"),
              detail: "high" as const,
            },
          ]
        : [
            {
              type: "input_image" as const,
              detail: "high" as const,
              image_url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
            },
          ];

    try {
      const response = await this.openai.responses.create({
        model: this.model,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "You analyze logistics documents and return strict JSON.",
                  "Return exactly this shape:",
                  '{"fields":[{"fieldKey":"string","label":"string","rawValue":"string|null","normalizedValue":"string|null","confidence":0,"status":"extracted|missing"}]}',
                  "Use snake_case fieldKey values.",
                  "If a value is absent, set rawValue and normalizedValue to null and status to missing.",
                ].join(" "),
              },
            ],
          },
          {
            role: "user",
            content: [
              ...content,
              {
                type: "input_text",
                text: "Extract the core document fields relevant for operations, compliance, and shipment matching.",
              },
            ],
          },
        ],
      });

      const parsed = this.parseResponse(response.output_text);
      return {
        extractionModel: this.model,
        extractedFields: parsed,
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Document vision analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  private parseResponse(outputText: string): VisionExtractedField[] {
    try {
      const parsed = JSON.parse(outputText) as {
        fields?: Array<Partial<VisionExtractedField>>;
      };

      return (parsed.fields ?? [])
        .filter((field) => typeof field.fieldKey === "string" && typeof field.label === "string")
        .map((field) => ({
          fieldKey: field.fieldKey!.trim(),
          label: field.label!.trim(),
          rawValue:
            typeof field.rawValue === "string" ? field.rawValue : null,
          normalizedValue:
            typeof field.normalizedValue === "string"
              ? field.normalizedValue
              : null,
          confidence:
            typeof field.confidence === "number"
              ? Math.max(0, Math.min(100, Math.round(field.confidence)))
              : null,
          status: field.status === "missing" ? "missing" : "extracted",
        }));
    } catch {
      return [];
    }
  }
}
