import { PortalShell } from "@/components/layout/portal-shell";
import { requireApplicantSession } from "@/lib/auth";

export default async function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireApplicantSession();

  return (
    <PortalShell
      user={user}
      eyebrow="Applicant Workspace"
      title="Licensing Application Workspace"
    >
      {children}
    </PortalShell>
  );
}
