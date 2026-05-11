import React from "react";

type EmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function EmptyState({ eyebrow, title, description }: EmptyStateProps) {
  return (
    <div className="surface-panel rounded-[1.75rem] border border-[var(--border)] p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--bnr-text-secondary)]">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-2xl font-semibold text-[var(--bnr-text-primary)]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--bnr-text-secondary)]">{description}</p>
    </div>
  );
}
