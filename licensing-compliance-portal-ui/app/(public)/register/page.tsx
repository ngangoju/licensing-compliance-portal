import Link from "next/link";
import { getLicenseRegister, type LicenseRegisterEntry } from "@/lib/api";
import { LicenseRegisterTable } from "@/components/register/license-register-table";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  let errorMessage: string | null = null;
  let entries: LicenseRegisterEntry[] = [];

  try {
    entries = await getLicenseRegister();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load the public license register.";
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="surface-panel overflow-hidden rounded-[1.75rem] border border-solid border-[var(--border)] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--bnr-text-secondary)]">
                National Bank of Rwanda
              </p>
              <h1 className="mt-4 text-4xl font-semibold text-[var(--bnr-text-primary)] sm:text-5xl">
                Public licensing register
              </h1>
              <p className="mt-4 text-base leading-8 text-[var(--bnr-text-secondary)]">
                Verify whether a bank, microfinance institution, forex bureau, or
                payment institution has received a final operating license from BNR.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded border border-[var(--bnr-brown)] px-5 py-3 text-sm font-semibold text-[var(--bnr-brown)] transition hover:bg-[var(--bnr-brown)] hover:text-white"
              >
                Staff and applicants sign in
              </Link>
            </div>
          </div>
        </div>
        <LicenseRegisterTable entries={entries} errorMessage={errorMessage} />
      </div>
    </div>
  );
}
