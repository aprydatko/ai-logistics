"use client";

import type { Document } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { documentsQueryOptions } from "@/lib/documents/documents-query";
import { driverCandidatesQueryOptions } from "@/lib/drivers/driver-candidates-query";
import { Checkbox } from "@repo/ui/components/checkbox";
import { DataPagination } from "@repo/ui/components/pagination";
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@repo/ui/components/table";

import { DeleteDocumentDialog } from "./delete-document-dialog";
import { DocumentEditDialog } from "./document-edit-dialog";
import { DocumentRow } from "./document-row";
import { DocumentsTableSkeleton } from "./documents-table-skeleton";
import { DocumentsToolbar } from "./documents-toolbar";
import { toDocumentsQuery, type DocumentFilters } from "./types";

const DEFAULT_FILTERS: DocumentFilters = {
  search: "",
  driverId: "all",
  type: "all",
  status: "all",
  page: 1,
  limit: 10,
};

const getPages = (
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> => {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) =>
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );
  return pages.flatMap((page, index) => {
    const previous = pages[index - 1];
    return previous && page - previous > 1 ? ["ellipsis" as const, page] : [page];
  });
};

export const DocumentsTable = (): React.JSX.Element => {
  const [filters, setFilters] = React.useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [editDocument, setEditDocument] = React.useState<Document | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Document | null>(null);

  React.useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(filters.search.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  const queryFilters = React.useMemo(
    () => toDocumentsQuery(filters, debouncedSearch),
    [debouncedSearch, filters],
  );
  const documentsQuery = useQuery(documentsQueryOptions(queryFilters));
  const driversQuery = useQuery(driverCandidatesQueryOptions);
  const documents = React.useMemo(
    () => documentsQuery.data?.data ?? [],
    [documentsQuery.data],
  );
  const pagination = documentsQuery.data?.pagination;
  const isAllSelected =
    documents.length > 0 &&
    documents.every((document) => selectedIds.has(document.id));
  const isPartiallySelected =
    !isAllSelected && documents.some((document) => selectedIds.has(document.id));

  const updateFilters = (updates: Partial<DocumentFilters>): void => {
    setFilters((current) => ({
      ...current,
      ...updates,
      page: updates.page ?? 1,
    }));
    setSelectedIds(new Set());
  };

  return (
    <section className="flex h-[calc(100svh-7rem)] flex-col gap-5 overflow-hidden">
      <DocumentsToolbar
        driverOptions={driversQuery.data ?? []}
        filters={filters}
        onChange={updateFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setDebouncedSearch("");
          setSelectedIds(new Set());
        }}
      />
      <DataTable className="flex min-h-0 flex-1 flex-col">
        <TableScrollArea className="min-h-0 flex-1 overflow-auto">
          <Table className="min-w-[1080px] table-fixed">
            <colgroup>
              <col className="w-10" /><col className="w-[24%]" />
              <col className="w-[16%]" /><col className="w-[14%]" />
              <col className="w-[11%]" /><col className="w-[13%]" />
              <col className="w-[18%]" /><col className="w-14" />
            </colgroup>
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-center">
                  <Checkbox
                    aria-label="Select all documents"
                    checked={isPartiallySelected ? "indeterminate" : isAllSelected}
                    onCheckedChange={(checked) =>
                      setSelectedIds(
                        checked === true
                          ? new Set(documents.map(({ id }) => id))
                          : new Set(),
                      )
                    }
                  />
                </TableHead>
                {["Document", "Type", "Driver", "Load", "Status", "Uploaded"].map(
                  (heading) => <TableHead key={heading}>{heading}</TableHead>,
                )}
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentsQuery.isPending ? <DocumentsTableSkeleton /> : null}
              {documentsQuery.isError ? (
                <TableRow><TableCell className="py-12 text-center" colSpan={8}>
                  Unable to load documents. Please try again.
                </TableCell></TableRow>
              ) : null}
              {documentsQuery.isSuccess && documents.length === 0 ? (
                <TableRow><TableCell className="py-12 text-center" colSpan={8}>
                  No documents found.
                </TableCell></TableRow>
              ) : null}
              {documents.map((document) => (
                <DocumentRow
                  document={document}
                  isSelected={selectedIds.has(document.id)}
                  key={document.id}
                  onDelete={setDeleteTarget}
                  onEdit={setEditDocument}
                  onSelectChange={(id, checked) =>
                    setSelectedIds((current) => {
                      const next = new Set(current);
                      if (checked) next.add(id);
                      else next.delete(id);
                      return next;
                    })
                  }
                />
              ))}
            </TableBody>
          </Table>
        </TableScrollArea>
        <DataPagination
          ariaLabel="Documents pagination"
          currentPage={filters.page}
          endItem={Math.min(filters.page * filters.limit, pagination?.total ?? 0)}
          itemName="documents"
          onPageChange={(page) => updateFilters({ page })}
          onPageSizeChange={(limit) => updateFilters({ limit })}
          pages={getPages(filters.page, Math.max(1, pagination?.totalPages ?? 1))}
          pageSize={filters.limit}
          pageSizeOptions={[10, 15, 20]}
          startItem={pagination?.total ? (filters.page - 1) * filters.limit + 1 : 0}
          totalItems={pagination?.total ?? 0}
          totalPages={Math.max(1, pagination?.totalPages ?? 1)}
        />
      </DataTable>
      <DocumentEditDialog
        document={editDocument}
        onOpenChange={(open) => {
          if (!open) setEditDocument(null);
        }}
      />
      <DeleteDocumentDialog
        document={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </section>
  );
};
