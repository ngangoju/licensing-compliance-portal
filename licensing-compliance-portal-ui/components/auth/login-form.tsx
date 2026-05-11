"use client";

import React from "react";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { roleHomePath, type UserRole } from "@/lib/auth-shared";

type LoginResponse = {
  user: {
    role: UserRole;
  };
};

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const response = await fetch("/api/session/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as
      | LoginResponse
      | { error?: { message?: string } }
      | null;

    if (!response.ok) {
      setError(data && "error" in data ? data.error?.message ?? "Authentication failed." : "Authentication failed.");
      return;
    }

    const userRole = (data as LoginResponse).user.role;
    startTransition(() => {
      router.push(roleHomePath(userRole));
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--bnr-text-secondary)]" htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="applicant@kcb.rw"
          className="w-full rounded-sm border border-[var(--border)] bg-white/80 px-4 py-3 text-[var(--bnr-text-primary)] outline-none transition focus:border-[var(--bnr-gold)] focus:ring-2 focus:ring-[rgba(200,146,26,0.25)]"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--bnr-text-secondary)]" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Test@1234"
          className="w-full rounded-sm border border-[var(--border)] bg-white/80 px-4 py-3 text-[var(--bnr-text-primary)] outline-none transition focus:border-[var(--bnr-gold)] focus:ring-2 focus:ring-[rgba(200,146,26,0.25)]"
        />
      </div>
      {error ? (
        <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-sm bg-bnr-gold px-4 py-3 text-sm font-semibold tracking-[0.18em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "AUTHENTICATING..." : "SIGN IN"}
      </button>

    </form>
  );
}
