import React from "react";
import type { AuditEntry } from "@/lib/api";
import { EmptyState } from "@/components/feedback/empty-state";

function formatAction(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function ApplicationTimeline({ auditEntries }: { auditEntries: AuditEntry[] }) {
  if (auditEntries.length === 0) {
    return (
      <EmptyState
        eyebrow="Audit Timeline"
        title="No workflow events yet"
        description="Timeline events will appear here as soon as the application starts collecting decisions, uploads, and regulatory actions."
      />
    );
  }

  return (
    <div className="surface-panel rounded-[1.75rem] p-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--bnr-text-secondary)]">
          Audit Timeline
        </p>
        <h3 className="text-2xl font-semibold text-[var(--bnr-text-primary)]">Regulatory history</h3>
      </div>
      <ol className="mt-6 space-y-5">
        {auditEntries.map((entry) => (
          <li
            key={entry.id}
            className="grid gap-3 rounded-[1.4rem] border border-[var(--border)] bg-white/80 p-5 md:grid-cols-[auto_1fr]"
          >
            <div className="rounded-full bg-[var(--muted)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--bnr-text-secondary)]">
              {formatDateTime(entry.createdAt)}
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--bnr-text-primary)]">{formatAction(entry.action)}</p>
              <p className="mt-1 text-sm text-[var(--bnr-text-secondary)]">
                {(entry.actorName ?? "System")} · {entry.actorRole}
              </p>
              {entry.description ? (
                <p className="mt-3 text-sm leading-7 text-[var(--bnr-text-primary)]">{entry.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
