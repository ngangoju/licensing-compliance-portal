"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ApplicationData } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";

type DashboardProps = {
  applications: ApplicationData[];
  caseManagers: { id: string, fullName: string }[];
  token: string;
};

export function ComplianceDashboard({ applications, caseManagers, token }: DashboardProps) {
  const [selectedApp, setSelectedApp] = useState<ApplicationData | null>(null);
  const [caseManagerId, setCaseManagerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingCount = applications.filter(a => ["NAME_APPROVAL_PENDING", "SUBMITTED", "COMPLETENESS_CHECK"].includes(a.status)).length;
  const approvedCount = applications.filter(a => a.status === "LICENSED").length;

  const handleAssign = async () => {
    if (!selectedApp || !caseManagerId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8080/api/applications/${selectedApp.id}/assign-case-manager`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caseManagerId }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to assign case manager");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
      setSelectedApp(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Applications Under Oversight" value={applications.length} />
        <StatCard title="Pending BNR Action" value={pendingCount} color="amber" />
        <StatCard title="Successful Licenses" value={approvedCount} color="green" />
      </div>

      <section className="surface-panel rounded-lg overflow-hidden border border-[var(--border)] shadow-sm">
        <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-white">
          <h3 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Compliance & Triage Queue</h3>
          <Link href="/bnr/applications" className="text-sm text-bnr-gold hover:underline font-medium">
            Browse All Records
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--muted)]/50 text-[var(--bnr-text-secondary)]">
              <tr>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Institution</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {applications.slice(0, 10).map((app) => (
                <tr key={app.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-[var(--bnr-text-primary)]">{app.referenceNumber}</td>
                  <td className="px-6 py-4 text-[var(--bnr-text-primary)]">{app.proposedName}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    {app.status === "COMPLETENESS_CHECK" && (
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="text-[var(--bnr-brown)] font-semibold hover:underline"
                      >
                        Assign CM
                      </button>
                    )}
                    <Link
                      href={`/bnr/applications/${app.id}`}
                      className="text-bnr-gold hover:underline font-semibold"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assign Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="surface-panel rounded-lg p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[var(--bnr-text-primary)] mb-4">Assign Case Manager</h3>
            <p className="text-sm text-[var(--bnr-text-secondary)] mb-6">
              Assign a case manager for <strong>{selectedApp.proposedName}</strong> ({selectedApp.referenceNumber}).
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--bnr-text-secondary)] mb-1">Select Case Manager</label>
                <select
                  value={caseManagerId}
                  onChange={(e) => setCaseManagerId(e.target.value)}
                  className="w-full input-field bg-white"
                >
                  <option value="">-- Choose --</option>
                  {caseManagers.map(cm => (
                    <option key={cm.id} value={cm.id}>{cm.fullName}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="btn-secondary py-2 px-6"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!caseManagerId || isSubmitting}
                  className="btn-primary py-2 px-6"
                >
                  {isSubmitting ? "Assigning..." : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color?: string }) {
  const colorClass = color === "amber" ? "text-amber-600" : color === "green" ? "text-green-600" : "text-[var(--bnr-text-primary)]";
  return (
    <div className="surface-panel rounded-lg p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--bnr-text-secondary)] mb-2">{title}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}
