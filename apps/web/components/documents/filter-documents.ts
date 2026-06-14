import type { DocumentFilters, DocumentRowData } from "./types";

export const filterDocuments = (
  documents: DocumentRowData[],
  filters: DocumentFilters,
): DocumentRowData[] => {
  const search = filters.search.trim().toLocaleLowerCase();

  return documents.filter((document) => {
    const matchesSearch =
      search === "" ||
      [
        document.fileName,
        document.driver,
        document.load,
        document.type,
      ].some((value) => value.toLocaleLowerCase().includes(search));
    const matchesDriver =
      filters.driver === "all" || document.driver === filters.driver;
    const matchesType =
      filters.type === "all" || document.type === filters.type;
    const matchesStatus =
      filters.status === "all" || document.status === filters.status;

    return matchesSearch && matchesDriver && matchesType && matchesStatus;
  });
};
