import { requireBnrSession, getAuthToken } from "@/lib/auth";
import { getAllUsers, UserResponse } from "@/lib/api";
import { UserManagementClient } from "@/components/admin/user-management-client";
import { redirect } from "next/navigation";

export default async function UserManagementPage() {
  const session = await requireBnrSession();
  
  if (session.role !== "ADMIN") {
    redirect("/bnr/dashboard");
  }

  const token = getAuthToken();
  let users: UserResponse[] = [];
  try {
    users = await getAllUsers(token || "");
  } catch (err) {
    console.error("Failed to fetch users", err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--bnr-text-primary)]">User Management</h1>
        <p className="text-[var(--bnr-text-secondary)] mt-1">
          Manage system users, access roles, and account status.
        </p>
      </div>

      <UserManagementClient initialUsers={users} token={token || ""} />
    </div>
  );
}
