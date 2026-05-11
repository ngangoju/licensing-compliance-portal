import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getServerSession } from "@/lib/auth";
import { roleHomePath } from "@/lib/auth-shared";

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) {
    redirect(roleHomePath(session.role));
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="surface-panel grid w-full max-w-5xl overflow-hidden rounded-md lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-bnr-brown p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.32em] text-[rgba(255,255,255,0.72)]">
              National Bank of Rwanda
            </p>
            <h1 className="max-w-md text-5xl font-semibold leading-[1.05] text-[var(--bnr-cream-light)]">
              Licensing decisions with a traceable regulatory record.
            </h1>
            <p className="max-w-lg text-base leading-7 text-[rgba(255,255,255,0.82)]">
              Access the Bank Licensing & Compliance Portal to manage submissions,
              reviews, and supervisory decisions in one controlled workflow.
            </p>
          </div>

        </section>
        <section className="bg-[rgba(255,250,241,0.84)] p-8 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--bnr-text-secondary)]">
              Secure Sign-In
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-[var(--bnr-text-primary)]">
              Bank Licensing & Compliance Portal
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--bnr-text-secondary)]">
              Sign in to access your licensing workspace. BNR staff and registered
              applicants use this portal.
            </p>
            <div className="mt-8">
              <LoginForm />
            </div>
            <div className="mt-6 text-center lg:text-left">
              <p className="text-sm text-[var(--bnr-text-secondary)]">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-[var(--bnr-gold)] hover:underline"
                >
                  Register as an applicant →
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
