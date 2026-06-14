import { Skeleton } from "@repo/ui/components/skeleton";
import { TableCell, TableRow } from "@repo/ui/components/table";

export const DocumentsTableSkeleton = (): React.JSX.Element => (
  <>
    {Array.from({ length: 6 }, (_, index) => (
      <TableRow key={index}>
        <TableCell colSpan={8}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    ))}
  </>
);
