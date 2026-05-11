import { requireBnrSession } from "@/lib/auth";
import { getAuthToken } from "@/lib/auth";
import { ApplicationData } from "@/lib/api";
import { ComplianceDashboard } from "@/components/dashboards/compliance-dashboard";
import { CaseManagerDashboard } from "@/components/dashboards/case-manager-dashboard";
import { TechnicalReviewerDashboard } from "@/components/dashboards/technical-reviewer-dashboard";
import { LegalOfficerDashboard } from "@/components/dashboards/legal-officer-dashboard";
import { InspectionOfficerDashboard } from "@/components/dashboards/inspection-officer-dashboard";
import { FitAndProperDashboard } from "@/components/dashboards/fit-and-proper-dashboard";
import { CommitteeDashboard } from "@/components/dashboards/committee-dashboard";
import { DelegateDashboard } from "@/components/dashboards/delegate-dashboard";
import { AuditorDashboard } from "@/components/dashboards/auditor-dashboard";

export default async function BnrDashboardPage() {
  const session = await requireBnrSession();
  const token = getAuthToken();
  
  let applications: ApplicationData[] = [];
  let caseManagers: { id: string, fullName: string }[] = [];

  try {
    const res = await fetch("http://localhost:8080/api/applications/queue", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store"
    });
    if (res.ok) {
      applications = await res.json();
    }

    if (session.role === "COMPLIANCE_OFFICER" || session.role === "ADMIN") {
      const cmRes = await fetch("http://localhost:8080/api/applications/case-managers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store"
      });
      if (cmRes.ok) {
        caseManagers = await cmRes.json();
      }
    }
  } catch (err) {
    console.error("Failed to fetch dashboard data", err);
  }

  const renderDashboard = () => {
    switch (session.role) {
      case "COMPLIANCE_OFFICER":
      case "ADMIN":
        return <ComplianceDashboard applications={applications} caseManagers={caseManagers} token={token || ""} />;
      case "CASE_MANAGER":
        return <CaseManagerDashboard applications={applications} />;
      case "FIT_AND_PROPER_OFFICER":
        return <FitAndProperDashboard applications={applications} />;
      case "TECHNICAL_REVIEWER":
        return <TechnicalReviewerDashboard applications={applications} token={token || ""} />;
      case "LEGAL_OFFICER":
        return <LegalOfficerDashboard applications={applications} />;
      case "INSPECTION_OFFICER":
        return <InspectionOfficerDashboard applications={applications} />;
      case "LICENSING_COMMITTEE":
        return <CommitteeDashboard applications={applications} />;
      case "GOVERNOR_DELEGATE":
        return <DelegateDashboard applications={applications} />;
      case "AUDITOR":
        return <AuditorDashboard applications={applications} />;
      default:
        return <AuditorDashboard applications={applications} />; // Fallback to view-only
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--bnr-text-primary)]">Operations Dashboard</h1>
        <p className="text-[var(--bnr-text-secondary)] mt-1">
          Overview of licensing activities for the {session.role.replace(/_/g, " ")} role.
        </p>
      </div>
      {renderDashboard()}
    </div>
  );
}
