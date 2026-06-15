"use client";

import { AiLogDetails } from "../ai-log-details";

import { getPages } from "./constants";
import { AiLogsFilters } from "./ai-logs-filters";
import { AiLogsHeader } from "./ai-logs-header";
import { AiLogsMetrics } from "./ai-logs-metrics";
import { AiLogsTable } from "./ai-logs-table";
import { useAiLogsWorkspace } from "./use-ai-logs-workspace";

export const AiLogsWorkspace = (): React.JSX.Element => {
  const {
    endItem,
    error,
    from,
    isLoading,
    limit,
    logs,
    model,
    operation,
    operationOptions,
    page,
    selected,
    setLimit,
    setPage,
    setSelected,
    startItem,
    status,
    to,
    totalItems,
    totalPages,
    updateDateRange,
    updateModel,
    updateOperation,
    updateStatus,
  } = useAiLogsWorkspace();

  return (
    <section className="flex h-full min-h-0 flex-col gap-5 overflow-hidden">
      <AiLogsHeader />
      <AiLogsMetrics />
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
          endItem={endItem}
          error={error}
          isLoading={isLoading}
          limit={limit}
          logs={logs}
          page={page}
          pages={getPages(page, totalPages)}
          selected={selected}
          setLimit={setLimit}
          setPage={setPage}
          setSelected={setSelected}
          startItem={startItem}
          totalItems={totalItems}
          totalPages={totalPages}
        />
        {selected ? (
          <AiLogDetails log={selected} onClose={() => setSelected(null)} />
        ) : null}
      </div>
    </section>
  );
};
