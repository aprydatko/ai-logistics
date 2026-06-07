import { DataPagination } from "@repo/ui/components/pagination";
import type { DriversFilters } from "@/lib/drivers/drivers-query";

const getPaginationPages = (
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> => {
  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (page) =>
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );

  return visiblePages.flatMap((page, index) => {
    const previousPage = visiblePages[index - 1];

    return previousPage && page - previousPage > 1
      ? ["ellipsis" as const, page]
      : [page];
  });
};

interface DriversPaginationProps {
  filters: DriversFilters;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const DriversPagination = ({
  filters,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: DriversPaginationProps): React.JSX.Element => {
  const startItem =
    totalItems === 0 ? 0 : (filters.page - 1) * filters.limit + 1;
  const endItem = Math.min(filters.page * filters.limit, totalItems);

  return (
    <DataPagination
      ariaLabel="Drivers pagination"
      currentPage={filters.page}
      endItem={endItem}
      itemName="drivers"
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      pages={getPaginationPages(filters.page, totalPages)}
      pageSize={filters.limit}
      pageSizeOptions={[10, 15, 20]}
      startItem={startItem}
      totalItems={totalItems}
      totalPages={totalPages}
    />
  );
};
