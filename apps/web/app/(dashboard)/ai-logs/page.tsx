import { Suspense } from "react";

import { AiLogsWorkspace } from "@/components/ai-logs/ai-logs-workspace";

export default function AiLogsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <section className="flex h-full min-h-0 flex-col gap-5 overflow-hidden">
          <div className="rounded-3xl border border-dashed border-border bg-surface p-6 text-sm text-ink-500">
            Loading AI logs workspace...
          </div>
        </section>
      }
    >
      <AiLogsWorkspace />
    </Suspense>
  );
}
