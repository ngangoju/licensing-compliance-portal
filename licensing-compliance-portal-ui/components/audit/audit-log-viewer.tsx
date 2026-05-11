"use client";
import React, { useEffect, useState } from "react";
import { AuditEntryFull, PaginatedResponse, getGlobalAuditLog } from "@/lib/api";
import { format } from "date-fns";

type AuditLogViewerProps = {
  token: string;
};

export function AuditLogViewer({ token }: AuditLogViewerProps) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PaginatedResponse<AuditEntryFull> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const result = await getGlobalAuditLog(token, page, 20);
        setData(result);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [token, page]);

  if (loading && !data) {
    return <div className="py-12 text-center text-[var(--bnr-text-secondary)]">Loading system audit trail...</div>;
  }

  if (!data || data.content.length === 0) {
    return <div className="py-12 text-center text-[var(--bnr-text-secondary)]">No audit entries found.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="surface-panel rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--muted)]/30 text-[var(--bnr-text-secondary)]">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Timestamp</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Actor</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Action</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Details</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Application</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-white">
              {data.content.map((entry) => (
                <tr key={entry.id} className="hover:bg-[var(--muted)]/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-[var(--bnr-text-secondary)]">
                    {format(new Date(entry.createdAt), "yyyy-MM-dd HH:mm:ss")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--bnr-text-primary)]">{entry.actorName || "System"}</div>
                    <div className="text-[10px] text-[var(--bnr-text-secondary)] uppercase tracking-tighter">{entry.actorRole}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800">
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[var(--bnr-text-primary)] max-w-xs truncate" title={entry.description || ""}>
                      {entry.description}
                    </div>
                    {entry.newState && (
                      <div className="text-[10px] mt-1 text-blue-600 font-medium">
                        State: {entry.previousState || "NONE"} → {entry.newState}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[var(--bnr-text-secondary)]">
                    {entry.applicationId?.substring(0, 8)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-[var(--bnr-text-secondary)]">
          Showing {data.number * data.size + 1} to {Math.min((data.number + 1) * data.size, data.totalElements)} of {data.totalElements} events
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={data.first || loading}
            className="btn-secondary py-1 px-3 text-xs disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={data.last || loading}
            className="btn-secondary py-1 px-3 text-xs disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
