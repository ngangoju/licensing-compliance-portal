import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildApiUrl, readBackendError } from "@/lib/api";
import { roleHomePath, type SessionUser } from "@/lib/auth-shared";

type BackendLoginResponse = {
  accessToken: string;
  refreshToken: string;
  email: string;
  role: SessionUser["role"];
  fullName: string;
  organisation?: string;
};

export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch(buildApiUrl("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await readBackendError(response);
    return NextResponse.json({ error: { message } }, { status: response.status });
  }

  const data = (await response.json()) as BackendLoginResponse;
  const cookieStore = cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set("accessToken", data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 15,
  });
  cookieStore.set("refreshToken", data.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({
    user: {
      email: data.email,
      role: data.role,
      fullName: data.fullName,
      organisation: data.organisation ?? "",
    },
    nextPath: roleHomePath(data.role),
  });
}
