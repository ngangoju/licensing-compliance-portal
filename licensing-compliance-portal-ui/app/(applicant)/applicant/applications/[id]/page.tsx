import { requireApplicantSession } from "@/lib/auth";
import { getApplicationDetail } from "@/lib/api";
import { cookies } from "next/headers";
import { ApplicantApplicationDetailClient } from "@/components/applicant-application-detail-client";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = await params;
  await requireApplicantSession();
  
  const token = cookies().get("accessToken")?.value;
  if (!token) return <div>Not authenticated</div>;

  const appData = await getApplicationDetail(unwrappedParams.id, token);

  return <ApplicantApplicationDetailClient id={unwrappedParams.id} token={token} initialData={appData} />;
}
