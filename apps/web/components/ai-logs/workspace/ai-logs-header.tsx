import { CalendarDays, Filter } from "lucide-react";

import { Button } from "@repo/ui/components/button";

export const AiLogsHeader = (): React.JSX.Element => (
  <header className="flex shrink-0 flex-col justify-between gap-4 lg:flex-row lg:items-end">
    <div>
      <h1 className="text-2xl leading-9 text-ink-900">AI Activity Logs</h1>
      <p className="text-sm text-primary-700">
        Overview of AI operations, model performance, usage, and errors.
      </p>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button className="h-10 bg-card text-primary-700" variant="outline">
        <CalendarDays />
        May 24 – May 28, 2025
      </Button>
      <Button className="h-10 bg-card text-primary-700" variant="outline">
        <Filter />
        Filters{" "}
        <span className="rounded-full bg-primary-700 px-2 py-0.5 text-xs text-white">
          3
        </span>
      </Button>
    </div>
  </header>
);
