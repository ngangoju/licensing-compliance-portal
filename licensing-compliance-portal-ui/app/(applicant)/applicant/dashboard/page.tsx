import { requireApplicantSession } from "@/lib/auth";
import { getMyApplications } from "@/lib/api";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LICENSE_TYPE_LABELS } from "@/lib/constants";

export default async function ApplicantDashboardPage() {
  await requireApplicantSession();
  const token = cookies().get("accessToken")?.value;
  const applications = token ? await getMyApplications(token) : [];

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--bnr-text-secondary)]">
            Applicant Dashboard
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--bnr-text-primary)]">
            Your Applications
          </h2>
        </div>
        <Link href="/applicant/applications/new">
          <Button>Start New Application</Button>
        </Link>
      </div>

      <section className="surface-panel rounded-[1.75rem] p-6">
        {applications.length === 0 ? (
          <EmptyState
            title="No applications started"
            subtitle="You haven't started any licensing applications yet. Click the button above to begin a new application."
            action={
              <Link href="/applicant/applications/new">
                <Button>Start Application</Button>
              </Link>
            }
            icon={
              <svg className="w-8 h-8 text-[var(--bnr-brown-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--bnr-text-primary)]">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference Number</th>
                  <th className="px-4 py-3 font-medium">Proposed Name</th>
                  <th className="px-4 py-3 font-medium">License Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono">{app.referenceNumber}</td>
                    <td className="px-4 py-3 font-medium">{app.proposedName}</td>
                    <td className="px-4 py-3">{LICENSE_TYPE_LABELS[app.licenseType] || app.licenseType.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--bnr-text-secondary)]">
                      {new Intl.DateTimeFormat('en-RW', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(app.updatedAt))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/applicant/applications/${app.id}`}
                        className="text-[var(--bnr-brown)] font-medium hover:text-[var(--bnr-brown-dark)]"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
