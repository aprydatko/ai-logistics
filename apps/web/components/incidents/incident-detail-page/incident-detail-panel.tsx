type IncidentDetailPanelProps = {
  action?: React.ReactNode;
  children: React.ReactNode;
  title: string;
};

export const IncidentDetailPanel = ({
  action,
  children,
  title,
}: IncidentDetailPanelProps): React.JSX.Element => (
  <article className="rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
    <div className="mb-6 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-ink-900">{title}</h2>
      {action}
    </div>
    {children}
  </article>
);
