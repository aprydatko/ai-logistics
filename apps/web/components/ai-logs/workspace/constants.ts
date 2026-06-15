import type { AiLogFilterOption } from "./types";

export const DEFAULT_PAGE_SIZE = 10;

export const modelOptions: AiLogFilterOption[] = [
  { label: "All models", value: "all" },
  { label: "GPT-4.1", value: "gpt-4.1" },
  { label: "GPT-4.1 Mini", value: "gpt-4.1-mini" },
];

export const statusOptions: AiLogFilterOption[] = [
  { label: "All statuses", value: "all" },
  { label: "Success", value: "success" },
  { label: "Failed", value: "failed" },
];

export const getPages = (
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> => {
  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (page) =>
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );

  return pages.flatMap((page, index) => {
    const previous = pages[index - 1];
    return previous && page - previous > 1
      ? ["ellipsis" as const, page]
      : [page];
  });
};
