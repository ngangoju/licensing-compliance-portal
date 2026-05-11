import React from "react";
import type { LicenseRegisterEntry } from "@/lib/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/workflow/status-badge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

type LicenseRegisterTableProps = {
  entries: LicenseRegisterEntry[];
  errorMessage?: string | null;
};

export function LicenseRegisterTable({
  entries,
  errorMessage,
}: LicenseRegisterTableProps) {
  if (errorMessage) {
    return (
      <EmptyState
        eyebrow="Public Register"
        title="Register temporarily unavailable"
        description={errorMessage}
      />
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        eyebrow="Public Register"
        title="No licensed institutions published yet"
        description="Licensed entities will appear here once BNR has issued a final license and published the institution to the public register."
      />
    );
  }

  return (
    <div className="surface-panel overflow-hidden rounded-[1.9rem]">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--bnr-text-secondary)]">
            Public Verification
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--bnr-text-primary)]">
            Licensed institutions register
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[var(--bnr-text-secondary)]">
          Confirm that an institution has received a final license from the National Bank
          of Rwanda and review the public reference details attached to that approval.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)]">
          <thead className="bg-[var(--bnr-cream-light)]/80">
            <tr className="text-left text-xs uppercase tracking-[0.22em] text-[var(--bnr-text-secondary)]">
              <th className="px-6 py-4 font-semibold">Institution</th>
              <th className="px-6 py-4 font-semibold">License Type</th>
              <th className="px-6 py-4 font-semibold">License Number</th>
              <th className="px-6 py-4 font-semibold">Licensed On</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-white/80">
            {entries.map((entry) => (
              <tr key={entry.licenseNumber} className="align-top">
                <td className="px-6 py-5">
                  <p className="text-base font-semibold text-[var(--bnr-text-primary)]">
                    {entry.institutionName}
                  </p>
                </td>
                <td className="px-6 py-5 text-sm text-[var(--bnr-text-secondary)]">
                  {entry.licenseType.replaceAll("_", " ")}
                </td>
                <td className="px-6 py-5 font-mono text-sm text-[var(--bnr-text-primary)]">
                  {entry.licenseNumber}
                </td>
                <td className="px-6 py-5 text-sm text-[var(--bnr-text-secondary)]">
                  {formatDate(entry.licensedAt)}
                </td>
                <td className="px-6 py-5">
                  <StatusBadge status={entry.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
