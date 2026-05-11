import { requireApplicantSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { NewApplicationForm } from "./new-application-form";
import { BackButton } from "@/components/ui/BackButton";

export default async function NewApplicationPage() {
  await requireApplicantSession();
  const token = cookies().get("accessToken")?.value;

  if (!token) return null; // Should be handled by requireApplicantSession but satisfies TS

  return (
    <div className="max-w-3xl mx-auto py-8">
      <BackButton label="Back to Dashboard" href="/applicant/dashboard" />
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[var(--bnr-text-primary)]">
          Start New Application
        </h1>
        <p className="mt-2 text-[var(--bnr-text-secondary)]">
          Draft a new license application. You can save your progress and return
          later before formally submitting to BNR.
        </p>
      </div>
      
      <div className="surface-panel rounded-[1.75rem] p-8">
        <NewApplicationForm token={token} />
      </div>
    </div>
  );
}
