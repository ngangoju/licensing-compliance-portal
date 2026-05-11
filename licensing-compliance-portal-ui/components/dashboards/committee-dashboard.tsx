"use client";
import React from "react";
import Link from "next/link";
import { ApplicationData } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";

type DashboardProps = {
  applications: ApplicationData[];
};

export function CommitteeDashboard({ applications }: DashboardProps) {
  const pendingCount = applications.filter(a => a.status === "COMMITTEE_DELIBERATION").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Applications for Deliberation" value={pendingCount} color="amber" />
        <StatCard title="Decisions Reached Today" value={0} color="green" />
        <StatCard title="Total Board Reviews" value={0} />
      </div>

      <section className="surface-panel rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
        <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-white">
          <h3 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Licensing Committee Docket</h3>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {applications.length} Active Items
          </span>
        </div>
        <div className="overflow-x-auto">
          {applications.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--muted)]/30 text-[var(--bnr-text-secondary)]">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Reference</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Institution</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--muted)]/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--bnr-text-primary)]">{app.referenceNumber}</td>
                    <td className="px-6 py-4 text-[var(--bnr-text-primary)] font-medium">{app.proposedName}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/bnr/applications/${app.id}`}
                        className="btn-primary py-1.5 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-700"
                      >
                        Start Deliberation
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center">
              <p className="text-[var(--bnr-text-secondary)]">No applications awaiting deliberation.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color?: string }) {
  const colorClass = 
    color === "amber" ? "text-amber-600" : 
    color === "green" ? "text-green-600" : 
    "text-[var(--bnr-text-primary)]";
    
  return (
    <div className="surface-panel rounded-xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--bnr-text-secondary)]">{title}</p>
        <div className={`h-2 w-2 rounded-full ${
          color === "amber" ? "bg-amber-500" : 
          color === "green" ? "bg-green-500" : 
          "bg-bnr-brown"
        }`}></div>
      </div>
      <p className={`mt-4 text-4xl font-extrabold tracking-tight ${colorClass}`}>{value}</p>
    </div>
  );
}
