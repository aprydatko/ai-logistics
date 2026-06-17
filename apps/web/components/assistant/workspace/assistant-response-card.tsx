import type { AssistantLinkedEntity, AssistantReportType } from "@repo/shared";

type AssistantResponseCardProps = {
  answer: string;
  linkedEntity: AssistantLinkedEntity | null;
  reportType: AssistantReportType | null;
  usedTools: string[];
};

export const AssistantResponseCard = ({
  answer,
  linkedEntity,
  reportType,
  usedTools,
}: AssistantResponseCardProps): React.JSX.Element => (
  <section className="rounded-2xl border border-border bg-surface-50 p-4 shadow-xs">
    <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary-700">
      Assistant response
    </p>
    {reportType || linkedEntity || usedTools.length > 0 ? (
      <div className="mt-3 flex flex-wrap gap-2">
        {reportType ? (
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-blue-800">
            {reportType} report
          </span>
        ) : null}
        {linkedEntity ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-800">
            Linked: {linkedEntity.title}
          </span>
        ) : null}
        {usedTools.map((toolName) => (
          <span
            className="rounded-full bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-primary-700"
            key={toolName}
          >
            {toolName}
          </span>
        ))}
      </div>
    ) : null}
    <div className="mt-3 rounded-2xl bg-white px-4 py-3">
      <p className="whitespace-pre-wrap text-sm leading-6 text-ink-900">
        {answer}
      </p>
    </div>
  </section>
);
