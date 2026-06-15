"use client";

import * as React from "react";

export const ReviewIconButton = ({
  label,
  children,
  disabled = false,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}): React.JSX.Element => (
  <button
    aria-label={label}
    className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-primary-700 transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:text-ink-400 disabled:hover:bg-card"
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
);
