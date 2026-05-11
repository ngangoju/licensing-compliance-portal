import { requireBnrSession, getAuthToken } from "@/lib/auth";
import { AuditLogViewer } from "@/components/audit/audit-log-viewer";
import { redirect } from "next/navigation";

export default async function AuditPage() {
  const session = await requireBnrSession();
  
  // Only ADMIN and AUDITOR roles can see the global audit log
  if (session.role !== "ADMIN" && session.role !== "AUDITOR") {
    redirect("/bnr/dashboard");
  }

  const token = getAuthToken();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[var(--bnr-text-primary)]">System Audit Trail</h1>
          <p className="text-[var(--bnr-text-secondary)] mt-1">
            Immutable log of all licensing activities and administrative actions.
          </p>
        </div>
      </div>

      <AuditLogViewer token={token || ""} />
    </div>
  );
}
