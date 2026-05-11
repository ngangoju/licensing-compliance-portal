"use client";
import React from "react";
import Link from "next/link";
import { ApplicationData } from "@/lib/api";

type DashboardProps = {
  applications: ApplicationData[];
};

export function DelegateDashboard({ applications }: DashboardProps) {
  // Delegate sees applications that are ready for final sign-off (after fee payment)
  const readyForSignOff = applications.filter(a => a.status === "LICENSE_FEE_PENDING" && a.licenseFeePaidAt).length;
  const totalIssued = applications.filter(a => a.status === "LICENSED").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Ready for Executive Sign-off" value={readyForSignOff} color="green" />
        <StatCard title="Awaiting License Fee Payment" value={applications.filter(a => a.status === "LICENSE_FEE_PENDING" && !a.licenseFeePaidAt).length} color="amber" />
        <StatCard title="Total Licenses Issued" value={totalIssued} />
      </div>

      <section className="surface-panel rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
        <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-white">
          <h3 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Final Authorization Queue</h3>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
            {applications.length} Pending Records
          </span>
        </div>
        <div className="overflow-x-auto">
          {applications.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--muted)]/30 text-[var(--bnr-text-secondary)]">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Reference</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Institution</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Fee Status</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--muted)]/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--bnr-text-primary)]">{app.referenceNumber}</td>
                    <td className="px-6 py-4 text-[var(--bnr-text-primary)] font-medium">{app.proposedName}</td>
                    <td className="px-6 py-4">
                      {app.licenseFeePaidAt ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Fee Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          Awaiting Payment
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/bnr/applications/${app.id}`}
                        className={`btn-primary py-1.5 px-4 text-xs font-semibold ${
                          app.licenseFeePaidAt ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 hover:bg-gray-500"
                        }`}
                      >
                        {app.licenseFeePaidAt ? "Final Sign-off" : "View Progress"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center">
              <p className="text-[var(--bnr-text-secondary)]">No applications currently in queue.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color?: string }) {
  const colorClass = 
    color === "green" ? "text-green-600" : 
    color === "amber" ? "text-amber-600" : 
    "text-[var(--bnr-text-primary)]";
    
  return (
    <div className="surface-panel rounded-xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--bnr-text-secondary)]">{title}</p>
        <div className={`h-2 w-2 rounded-full ${
          color === "green" ? "bg-green-500" : 
          color === "amber" ? "bg-amber-500" : 
          "bg-bnr-brown"
        }`}></div>
      </div>
      <p className={`mt-4 text-4xl font-extrabold tracking-tight ${colorClass}`}>{value}</p>
    </div>
  );
}
