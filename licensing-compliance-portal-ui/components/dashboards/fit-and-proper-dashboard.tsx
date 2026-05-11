"use client";
import React from "react";
import Link from "next/link";
import { ApplicationData } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";

type DashboardProps = {
  applications: ApplicationData[];
};

export function FitAndProperDashboard({ applications }: DashboardProps) {
  const pendingCount = applications.filter(a => a.status === "CASE_ASSIGNED").length;
  const inProgressCount = applications.filter(a => a.status === "FIT_AND_PROPER_ASSESSMENT").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Total Assigned to You" value={applications.length} />
        <StatCard title="New Case Assignments" value={pendingCount} color="amber" />
        <StatCard title="Active Assessments" value={inProgressCount} color="blue" />
      </div>

      <section className="surface-panel rounded-lg overflow-hidden border border-[var(--border)] shadow-sm">
        <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-white">
          <h3 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Fit & Proper Assessment Queue</h3>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-bnr-brown/10 text-bnr-brown">
            {applications.length} Active Cases
          </span>
        </div>
        <div className="overflow-x-auto">
          {applications.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--muted)]/30 text-[var(--bnr-text-secondary)]">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Reference</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Institution</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Type</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--muted)]/10 transition-colors group">
                    <td className="px-6 py-4 font-medium text-[var(--bnr-text-primary)]">
                      {app.referenceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--bnr-text-primary)]">{app.proposedName}</div>
                      <div className="text-[10px] text-[var(--bnr-text-secondary)]">Updated {new Intl.DateTimeFormat('en-RW', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(app.updatedAt))}</div>
                    </td>
                    <td className="px-6 py-4 text-[var(--bnr-text-secondary)] text-xs">
                      {app.licenseType.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/bnr/applications/${app.id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-bnr-brown text-white hover:bg-bnr-brown/90 h-9 px-4 py-2"
                      >
                        {app.status === "CASE_ASSIGNED" ? "Start Assessment" : "Review"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center">
              <p className="text-[var(--bnr-text-secondary)]">No applications currently in your queue.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color?: string }) {
  const colorClass = 
    color === "amber" ? "text-amber-600 bg-amber-50" : 
    color === "blue" ? "text-blue-600 bg-blue-50" : 
    "text-[var(--bnr-text-primary)] bg-gray-50";
    
  return (
    <div className="surface-panel rounded-xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--bnr-text-secondary)]">{title}</p>
        <div className={`h-2 w-2 rounded-full ${color === "amber" ? "bg-amber-500" : color === "blue" ? "bg-blue-500" : "bg-bnr-brown"}`}></div>
      </div>
      <p className={`mt-4 text-4xl font-extrabold tracking-tight ${colorClass.split(' ')[0]}`}>{value}</p>
    </div>
  );
}
