import { requireBnrSession } from "@/lib/auth";
import { getApplicationDetail } from "@/lib/api";
import { cookies } from "next/headers";
import { BnrApplicationDetailClient } from "@/components/bnr-application-detail-client";

export default async function BnrApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = await params;
  const session = await requireBnrSession();
  const token = cookies().get("accessToken")?.value;
  if (!token) return <div>Not authenticated</div>;

  const appData = await getApplicationDetail(unwrappedParams.id, token);

  return (
    <BnrApplicationDetailClient 
      id={unwrappedParams.id} 
      token={token} 
      initialData={appData} 
      userRole={session.role}
    />
  );
}
