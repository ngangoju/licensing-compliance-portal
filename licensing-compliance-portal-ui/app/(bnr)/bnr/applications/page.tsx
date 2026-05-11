import { ApplicationData } from "@/lib/api";
import { getAuthToken, requireBnrSession } from "@/lib/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LICENSE_TYPE_LABELS } from "@/lib/constants";
import Link from "next/link";

export default async function BnrApplicationsQueue() {
  await requireBnrSession();
  const token = getAuthToken();
  
  let applications: ApplicationData[] = [];
  let error = "";

  try {
    const res = await fetch("http://localhost:8080/api/applications/queue", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store"
    });
    if (!res.ok) {
      throw new Error("Failed to fetch application queue");
    }
    applications = await res.json();
  } catch (err: unknown) {
    if (err instanceof Error) {
      error = err.message;
    } else {
      error = "An unknown error occurred";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--bnr-text-primary)]">
          Application Queue
        </h1>
        <p className="text-[var(--bnr-text-secondary)] mt-1">
          Review and process submitted licensing applications.
        </p>
      </div>

      {error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications in queue"
          subtitle="There are currently no applications waiting for review or processing."
          icon={
            <svg className="w-8 h-8 text-[var(--bnr-brown-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      ) : (
        <div className="surface-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--muted)]/50 text-[var(--bnr-text-secondary)]">
              <tr>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Applicant</th>
                <th className="px-6 py-4 font-medium">Institution Name</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-[var(--muted)]/20 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-[var(--bnr-text-primary)]">
                    {app.referenceNumber}
                  </td>
                  <td className="px-6 py-4 text-[var(--bnr-text-secondary)]">
                    {app.applicant}
                  </td>
                  <td className="px-6 py-4 text-[var(--bnr-text-primary)]">
                    {app.proposedName}
                  </td>
                  <td className="px-6 py-4 text-[var(--bnr-text-secondary)]">
                    {LICENSE_TYPE_LABELS[app.licenseType] || app.licenseType.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/bnr/applications/${app.id}`}
                      className="text-bnr-gold hover:underline font-semibold text-sm"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
