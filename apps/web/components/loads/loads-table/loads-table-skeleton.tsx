import { Skeleton } from "@repo/ui/components/skeleton";
import { TableCell, TableRow } from "@repo/ui/components/table";

export const LoadsTableSkeleton = (): React.JSX.Element => (
  <>
    {Array.from({ length: 8 }, (_, index) => (
      <TableRow key={index}>
        {Array.from({ length: 8 }, (_, cell) => (
          <TableCell key={cell}>
            <Skeleton className="h-4 w-full max-w-24" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);
