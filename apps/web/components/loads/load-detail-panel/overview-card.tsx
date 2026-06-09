type OverviewCardProps = {
  label: string;
  children: React.ReactNode;
};

export const OverviewCard = ({
  label,
  children,
}: OverviewCardProps): React.JSX.Element => (
  <div className="min-h-24 rounded-md border border-border/70 p-4">
    <p className="text-xs font-medium text-primary-700">{label}</p>
    <div className="mt-2 text-sm font-semibold text-ink-900">{children}</div>
  </div>
);
