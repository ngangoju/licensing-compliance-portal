"use client";
import React, { useState } from "react";
import { UserResponse, getAllUsers, deactivateUser, reactivateUser } from "@/lib/api";

type UserManagementClientProps = {
  initialUsers: UserResponse[];
  token: string;
};

export function UserManagementClient({ initialUsers, token }: UserManagementClientProps) {
  const [users, setUsers] = useState<UserResponse[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleUserStatus = async (user: UserResponse) => {
    setLoading(true);
    setError(null);
    try {
      if (user.active) {
        await deactivateUser(user.id, token);
      } else {
        await reactivateUser(user.id, token);
      }
      // Refresh list
      const updated = await getAllUsers(token);
      setUsers(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update user status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="surface-panel rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--muted)]/30 text-[var(--bnr-text-secondary)]">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Full Name</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Email</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Role</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--muted)]/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-[var(--bnr-text-primary)]">{user.fullName}</td>
                  <td className="px-6 py-4 text-[var(--bnr-text-secondary)]">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-tighter">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      user.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {user.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleUserStatus(user)}
                      disabled={loading}
                      className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${
                        user.active 
                          ? "text-red-600 hover:bg-red-50" 
                          : "text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {user.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
