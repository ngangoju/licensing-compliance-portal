import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isBnrRole, type SessionUser } from "@/lib/auth-shared";
import { requestBackendWithToken } from "@/lib/api";

export function getAuthToken(): string | undefined {
  return cookies().get("accessToken")?.value;
}

export async function getServerSession(): Promise<SessionUser | null> {
  const token = cookies().get("accessToken")?.value;
  if (!token) {
    return null;
  }

  try {
    return await requestBackendWithToken<SessionUser>("/me", token);
  } catch {
    return null;
  }
}

export async function requireApplicantSession() {
  const session = await getServerSession();
  if (!session || session.role !== "APPLICANT") {
    redirect("/login");
  }

  return session;
}

export async function requireBnrSession() {
  const session = await getServerSession();
  if (!session || !isBnrRole(session.role)) {
    redirect("/login");
  }

  return session;
}
