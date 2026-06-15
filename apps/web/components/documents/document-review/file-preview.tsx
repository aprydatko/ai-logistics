"use client";

import type { Document } from "@repo/shared";
import Image from "next/image";

export const FilePreview = ({
  document,
  isFullscreen,
}: {
  document: Document;
  isFullscreen: boolean;
}): React.JSX.Element => {
  if (!document.fileUrl) {
    return (
      <div className="flex min-h-[560px] items-center justify-center p-8 text-center text-sm text-ink-500">
        The original file is not available for this document.
      </div>
    );
  }

  if (document.mimeType?.startsWith("image/")) {
    return (
      <div className="relative h-[720px] w-full">
        <Image
          alt={document.fileName}
          className="object-contain"
          fill
          sizes="(min-width: 1536px) 50vw, 100vw"
          src={document.fileUrl}
          unoptimized
        />
      </div>
    );
  }

  if (document.mimeType === "application/pdf") {
    const previewUrl = `${document.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

    return (
      <iframe
        className={`h-full w-full border-0 ${isFullscreen ? "min-h-0" : "min-h-[720px]"}`}
        src={previewUrl}
        title={`Preview of ${document.fileName}`}
      />
    );
  }

  return (
    <div className="flex min-h-[560px] flex-col items-center justify-center gap-3 p-8 text-center text-sm text-ink-500">
      <p>A preview is not available for this file type.</p>
      <a
        className="font-semibold text-info hover:underline"
        download={document.fileName}
        href={document.fileUrl}
      >
        Download {document.fileName}
      </a>
    </div>
  );
};
