import { Skeleton } from "@repo/ui/components/skeleton";
import { TableCell, TableRow } from "@repo/ui/components/table";

const SKELETON_ROWS = 8;

export const DriversTableSkeleton = (): React.JSX.Element => (
  <>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <TableRow key={index}>
        <TableCell>
          <Skeleton className="mx-auto size-4" />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-28 max-w-full" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-16 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3 w-24 max-w-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3 w-28 max-w-full" />
        </TableCell>
        <TableCell>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="ml-auto size-7" />
        </TableCell>
      </TableRow>
    ))}
  </>
);
