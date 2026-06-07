"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { buttonVariants } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

function Pagination({
  className,
  ...props
}: React.ComponentProps<"nav">): React.JSX.Element {
  return (
    <nav
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">): React.JSX.Element {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1.5", className)}
      {...props}
    />
  );
}

function PaginationItem({
  ...props
}: React.ComponentProps<"li">): React.JSX.Element {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<VariantProps<typeof buttonVariants>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps): React.JSX.Element {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
      data-slot="pagination-link"
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        "border-border bg-card text-primary-700 hover:bg-info-soft-background aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:border-info-soft-background data-[active=true]:bg-info-soft-background",
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string;
}): React.JSX.Element {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeft className="size-4" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string;
}): React.JSX.Element {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRight className="size-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">): React.JSX.Element {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

type DataPaginationProps = {
  ariaLabel: string;
  className?: string;
  currentPage: number;
  endItem: number;
  itemName: string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pages?: Array<number | "ellipsis">;
  pageSize?: number;
  pageSizeLabel?: string;
  pageSizeOptions?: number[];
  startItem: number;
  totalItems: number;
  totalPages: number;
};

function DataPagination({
  ariaLabel,
  className,
  currentPage,
  endItem,
  itemName,
  onPageChange,
  onPageSizeChange,
  pageSize,
  pageSizeLabel,
  pageSizeOptions = [10, 15, 20],
  totalPages,
  pages = [1, 2, 3, "ellipsis", totalPages],
  startItem,
  totalItems,
}: DataPaginationProps): React.JSX.Element {
  const selectedPageSize = String(pageSize ?? pageSizeOptions[0]);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <div
      data-slot="data-pagination"
      className={cn("border-t border-border/70 px-4 py-4", className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-normal text-primary-700">
          Showing {startItem} to {endItem} of {totalItems} {itemName}
        </p>
        <Select
          value={selectedPageSize}
          onValueChange={(value) => {
            onPageSizeChange?.(Number(value));
          }}
        >
          <SelectTrigger
            aria-label="Items per page"
            className="h-10 rounded-lg border-border bg-card px-3.5 text-primary-700 shadow-none hover:bg-accent"
          >
            <SelectValue placeholder={pageSizeLabel ?? "10 / page"} />
          </SelectTrigger>
          <SelectContent align="end">
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Pagination aria-label={ariaLabel} className="mt-3">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              aria-disabled={!hasPreviousPage}
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (hasPreviousPage) {
                  onPageChange?.(currentPage - 1);
                }
              }}
            />
          </PaginationItem>
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === currentPage}
                  onClick={(event) => {
                    event.preventDefault();
                    onPageChange?.(page);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              aria-disabled={!hasNextPage}
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (hasNextPage) {
                  onPageChange?.(currentPage + 1);
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export {
  DataPagination,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
