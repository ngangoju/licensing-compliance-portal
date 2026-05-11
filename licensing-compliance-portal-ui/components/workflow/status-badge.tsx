import React from "react";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  LICENSED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DRAFT: "bg-slate-200 text-slate-700 border-slate-300",
  NAME_APPROVAL_PENDING: "bg-indigo-100 text-indigo-800 border-indigo-200",
  NAME_APPROVED: "bg-violet-100 text-violet-800 border-violet-200",
  SUBMITTED: "bg-sky-100 text-sky-800 border-sky-200",
  COMPLETENESS_CHECK: "bg-amber-100 text-amber-900 border-amber-200",
  INCOMPLETE: "bg-orange-100 text-orange-900 border-orange-200",
  CASE_ASSIGNED: "bg-stone-100 text-stone-800 border-stone-200",
  FIT_AND_PROPER_ASSESSMENT: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  TECHNICAL_REVIEW: "bg-rose-100 text-rose-800 border-rose-200",
  LEGAL_REVIEW: "bg-red-100 text-red-800 border-red-200",
  COMMITTEE_DELIBERATION: "bg-purple-100 text-purple-800 border-purple-200",
  APPROVAL_IN_PRINCIPLE: "bg-violet-100 text-violet-800 border-violet-200",
  ORGANIZATION_PERIOD: "bg-pink-100 text-pink-800 border-pink-200",
  PRE_LICENSE_INSPECTION: "bg-cyan-100 text-cyan-800 border-cyan-200",
  INSPECTION_FAILED: "bg-red-100 text-red-800 border-red-200",
  LICENSE_FEE_PENDING: "bg-yellow-100 text-yellow-900 border-yellow-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  WITHDRAWN: "bg-slate-200 text-slate-700 border-slate-300",
  AIP_EXPIRED: "bg-stone-200 text-stone-700 border-stone-300",
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-stone-100 text-stone-800 border-stone-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${style}`}
    >
      {formatStatus(status)}
    </span>
  );
}
