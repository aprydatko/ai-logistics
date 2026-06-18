/* eslint-disable turbo/no-undeclared-env-vars */
import { expect, test } from "@playwright/test";

const isRealApiRun = process.env.PLAYWRIGHT_REAL_API === "1";

test.describe("documents upload", () => {
  test.skip(
    !isRealApiRun,
    "This spec requires PLAYWRIGHT_REAL_API=1 with local API, Postgres, and MinIO running.",
  );

  test("uploads a document through presigned MinIO flow without legacy fallback", async ({
    page,
  }) => {
    const loginResponse = await page.request.post("/api/auth/login", {
      data: {
        email: "e2e.dispatcher@example.com",
        password: "Password123!",
      },
    });
    expect(loginResponse.ok()).toBe(true);

    const timestamp = Date.now();
    const fileName = `playwright-presigned-${timestamp}.pdf`;
    const fileContents = [
      "%PDF-1.4",
      "1 0 obj",
      "<< /Type /Catalog /Pages 2 0 R >>",
      "endobj",
      "2 0 obj",
      "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
      "endobj",
      "3 0 obj",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
      "endobj",
      "4 0 obj",
      "<< /Length 47 >>",
      "stream",
      "BT",
      "/F1 18 Tf",
      "72 96 Td",
      "(Playwright presigned upload) Tj",
      "ET",
      "endstream",
      "endobj",
      "5 0 obj",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      "endobj",
      "xref",
      "0 6",
      "0000000000 65535 f ",
      "0000000009 00000 n ",
      "0000000058 00000 n ",
      "0000000115 00000 n ",
      "0000000241 00000 n ",
      "0000000338 00000 n ",
      "trailer",
      "<< /Size 6 /Root 1 0 R >>",
      "startxref",
      "408",
      "%%EOF",
    ].join("\n");

    const directUploadResponses: Array<{
      url: string;
      method: string;
      status: number;
    }> = [];

    page.on("response", (response) => {
      const url = response.url();
      if (
        url.includes("/api/documents/uploads/initiate") ||
        url.includes("/api/documents/uploads/") ||
        url.includes(":9000/")
      ) {
        directUploadResponses.push({
          url,
          method: response.request().method(),
          status: response.status(),
        });
      }
    });

    await page.goto("/documents");
    await expect(page).toHaveURL("/documents");

    const uploadedDocument = await page.evaluate(
      async ({ fileContents, fileName }) => {
        const file = new File([fileContents], fileName, {
          type: "application/pdf",
        });

        const initiateResponse = await fetch("/api/documents/uploads/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            type: "bill_of_lading",
            analyzeWithVision: false,
          }),
        });

        if (!initiateResponse.ok) {
          throw new Error(await initiateResponse.text());
        }

        const initiatePayload = (await initiateResponse.json()) as {
          data: { id: string; uploadUrl: string };
        };

        const uploadResponse = await fetch(initiatePayload.data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Unable to upload file to MinIO");
        }

        const completeResponse = await fetch(
          `/api/documents/uploads/${initiatePayload.data.id}/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uploadId: initiatePayload.data.id }),
          },
        );

        if (!completeResponse.ok) {
          throw new Error(await completeResponse.text());
        }

        const completePayload = (await completeResponse.json()) as {
          data: { id: string; fileName: string; status: string };
        };

        return completePayload.data;
      },
      { fileContents, fileName },
    );

    expect(uploadedDocument.fileName).toBe(fileName);

    const fileAccessResult = await page.evaluate(async (documentId) => {
      const response = await fetch(`/api/documents/${documentId}/file-access`, {
        method: "GET",
      });

      return {
        ok: response.ok,
        status: response.status,
        body: await response.text(),
      };
    }, uploadedDocument.id);
    expect(
      fileAccessResult.ok,
      `file-access failed with status ${fileAccessResult.status}: ${fileAccessResult.body}`,
    ).toBe(true);

    expect(
      directUploadResponses.some(
        ({ method, status, url }) =>
          method === "POST" &&
          status === 201 &&
          url.includes("/api/documents/uploads/initiate"),
      ),
    ).toBe(true);
    expect(
      directUploadResponses.some(
        ({ method, status, url }) =>
          method === "PUT" && status === 200 && url.includes(":9000/"),
      ),
    ).toBe(true);
    expect(
      directUploadResponses.some(
        ({ method, status, url }) =>
          method === "POST" &&
          status === 201 &&
          url.includes("/api/documents/uploads/") &&
          url.includes("/complete"),
      ),
    ).toBe(true);
    expect(
      directUploadResponses.some(
        ({ method, url }) =>
          method === "POST" && url.endsWith("/api/documents/upload"),
      ),
    ).toBe(false);
  });
});
