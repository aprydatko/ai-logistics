import type * as React from "react";

export const EmptyTab = ({ label }: { label: string }): React.JSX.Element => (
  <div className="mx-5 mt-5 rounded-md border border-dashed border-border p-8 text-center text-sm text-primary-700">
    No {label.toLowerCase()} information is available.
  </div>
);

export const PanelSection = ({
  action,
  children,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  title: string;
}): React.JSX.Element => (
  <section className="mx-5 mt-4 rounded-md border border-border/70 pb-4">
    <div className="mb-3 flex items-center justify-between gap-3 border-b px-4 py-2">
      <h3 className="text-base font-bold text-ink-900">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);
