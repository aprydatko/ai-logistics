type AssistantResponseCardProps = {
  answer: string;
};

export const AssistantResponseCard = ({
  answer,
}: AssistantResponseCardProps): React.JSX.Element => (
  <section className="rounded-2xl border border-border bg-surface-50 p-4 shadow-xs">
    <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary-700">
      Assistant response
    </p>
    <div className="mt-3 rounded-2xl bg-white px-4 py-3">
      <p className="whitespace-pre-wrap text-sm leading-6 text-ink-900">
        {answer}
      </p>
    </div>
  </section>
);
