"use client";

import * as React from "react";

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

import { DocumentRow } from "./document-row";
import { DocumentsToolbar } from "./documents-toolbar";
import { filterDocuments } from "./filter-documents";
import { mockDocuments } from "./mock-documents";
import type { DocumentFilters } from "./types";

const defaultFilters: DocumentFilters = {
  search: "",
  driver: "all",
  type: "all",
  status: "all",
};

const driverOptions = [...new Set(mockDocuments.map(({ driver }) => driver))];
const typeOptions = [...new Set(mockDocuments.map(({ type }) => type))];

export const DocumentsTable = (): React.JSX.Element => {
  const [filters, setFilters] =
    React.useState<DocumentFilters>(defaultFilters);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const documents = React.useMemo(
    () => filterDocuments(mockDocuments, filters),
    [filters],
  );
  const isAllSelected =
    documents.length > 0 &&
    documents.every(({ id }) => selectedIds.has(id));
  const isPartiallySelected =
    !isAllSelected && documents.some(({ id }) => selectedIds.has(id));

  const updateFilters = (updates: Partial<DocumentFilters>): void => {
    setFilters((current) => ({ ...current, ...updates }));
    setSelectedIds(new Set());
  };

  return (
    <section className="flex h-[calc(100svh-7rem)] flex-col gap-5 overflow-hidden">
      <DocumentsToolbar
        driverOptions={driverOptions}
        filters={filters}
        onChange={updateFilters}
        onReset={() => {
          setFilters(defaultFilters);
          setSelectedIds(new Set());
        }}
        typeOptions={typeOptions}
      />
      <DataTable className="flex min-h-0 flex-1 flex-col">
        <TableScrollArea className="min-h-0 flex-1 overflow-auto">
          <Table className="min-w-[1080px] table-fixed">
            <colgroup>
              <col className="w-10" />
              <col className="w-[24%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[18%]" />
              <col className="w-14" />
            </colgroup>
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-center">
                  <Checkbox
                    aria-label="Select all documents"
                    checked={
                      isPartiallySelected ? "indeterminate" : isAllSelected
                    }
                    onCheckedChange={(checked) => {
                      setSelectedIds(
                        checked === true
                          ? new Set(documents.map(({ id }) => id))
                          : new Set(),
                      );
                    }}
                  />
                </TableHead>
                {[
                  "Document",
                  "Type",
                  "Driver",
                  "Load",
                  "Status",
                  "Uploaded",
                ].map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell className="py-12 text-center" colSpan={8}>
                    No documents found.
                  </TableCell>
                </TableRow>
              ) : null}
              {documents.map((document) => (
                <DocumentRow
                  document={document}
                  isSelected={selectedIds.has(document.id)}
                  key={document.id}
                  onSelectChange={(id, checked) => {
                    setSelectedIds((current) => {
                      const next = new Set(current);
                      if (checked) next.add(id);
                      else next.delete(id);
                      return next;
                    });
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </TableScrollArea>
        <DataPagination
          ariaLabel="Documents pagination"
          currentPage={1}
          endItem={documents.length}
          itemName="documents"
          pages={[1]}
          pageSize={10}
          pageSizeOptions={[10]}
          startItem={documents.length > 0 ? 1 : 0}
          totalItems={documents.length}
          totalPages={1}
        />
      </DataTable>
    </section>
  );
};
