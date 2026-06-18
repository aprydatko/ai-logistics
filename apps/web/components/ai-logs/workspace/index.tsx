"use client";

import { AiLogDetails } from "../ai-log-details";

import { AiLogsFilters } from "./ai-logs-filters";
import { AiLogsHeader } from "./ai-logs-header";
import { AiLogsMetrics } from "./ai-logs-metrics";
import { AiLogsTable } from "./ai-logs-table";
import { useAiLogsWorkspace } from "./use-ai-logs-workspace";

export const AiLogsWorkspace = (): React.JSX.Element => {
  const {
    error,
    from,
    goToNextPage,
    goToPreviousPage,
    hasMore,
    historyDepth,
    isLoading,
    limit,
    logs,
    metrics,
    model,
    operation,
    operationOptions,
    nextCursor,
    selected,
    setLimit,
    setSelected,
    status,
    to,
    updateDateRange,
    updateModel,
    updateOperation,
    updateStatus,
  } = useAiLogsWorkspace();

  return (
    <section className="flex h-full min-h-0 flex-col gap-5 overflow-hidden">
      <AiLogsHeader />
      <AiLogsMetrics isLoading={isLoading} metrics={metrics} />
      <AiLogsFilters
        from={from}
        model={model}
        operation={operation}
        operationOptions={operationOptions}
        status={status}
        to={to}
        updateDateRange={updateDateRange}
        updateModel={updateModel}
        updateOperation={updateOperation}
        updateStatus={updateStatus}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden xl:flex-row">
        <AiLogsTable
          error={error}
          goToNextPage={goToNextPage}
          goToPreviousPage={goToPreviousPage}
          hasMore={hasMore}
          historyDepth={historyDepth}
          isLoading={isLoading}
          limit={limit}
          logs={logs}
          nextCursor={nextCursor}
          selected={selected}
          setLimit={setLimit}
          setSelected={setSelected}
        />
        {selected ? (
          <AiLogDetails log={selected} onClose={() => setSelected(null)} />
        ) : null}
      </div>
    </section>
  );
};
