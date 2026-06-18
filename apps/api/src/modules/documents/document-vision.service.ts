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

export type DocumentVisionInput = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
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

  /**
   * Analyzes a document file using OpenAI Vision API to extract structured data.
   *
   * This method converts the file to base64, formats it appropriately for PDF or image files,
   * and sends it to OpenAI's vision model with a structured prompt for extracting logistics
   * document fields. It handles both PDF and image formats with different content structures.
   *
   * @param file - The uploaded file to analyze
   * @returns Analysis results with extracted fields, or null if service is disabled or analysis fails
   *
   * @example
   * ```ts
   * const analysis = await documentVisionService.analyze(uploadedFile);
   * if (analysis) {
   *   console.log(`Extracted ${analysis.extractedFields.length} fields`);
   * }
   * ```
   */
  async analyze(file: DocumentVisionInput): Promise<DocumentVisionAnalysis | null> {
    if (!this.openai) return null;

    const content =
      file.mimeType === "application/pdf"
        ? [
            {
              type: "input_file" as const,
              filename: file.fileName,
              file_data: file.buffer.toString("base64"),
              detail: "low" as const,
            },
          ]
        : [
            {
              type: "input_image" as const,
              detail: "low" as const,
              image_url: `data:${file.mimeType};base64,${file.buffer.toString("base64")}`,
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

  /**
   * Parses and validates the OpenAI Vision API response.
   *
   * This method safely parses the JSON response from OpenAI, validates the structure,
   * and normalizes the extracted field data. It handles malformed responses gracefully
   * by returning an empty array. The method performs type checking and data normalization
   * including trimming strings, clamping confidence values to 0-100 range, and ensuring
   * valid status values.
   *
   * @param outputText - Raw JSON response text from OpenAI
   * @returns Array of validated and normalized extracted fields
   */
  private parseResponse(outputText: string): VisionExtractedField[] {
    try {
      const parsed = JSON.parse(outputText) as {
        fields?: Array<Partial<VisionExtractedField>>;
      };

      return (parsed.fields ?? [])
        .filter(
          (field) =>
            typeof field.fieldKey === "string" &&
            typeof field.label === "string",
        )
        .map((field) => ({
          fieldKey: field.fieldKey!.trim(),
          label: field.label!.trim(),
          rawValue: typeof field.rawValue === "string" ? field.rawValue : null,
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
