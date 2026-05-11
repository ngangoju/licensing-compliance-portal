import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildApiUrl } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const { id, docId } = params;
    const token = cookies().get("accessToken")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const backendUrl = buildApiUrl(`/applications/${id}/documents/${docId}/download`);
    
    const response = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return new NextResponse("Document not found or access denied", { status: response.status });
    }

    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = response.headers.get("content-disposition") || "attachment";

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (err: unknown) {
    console.error("Proxy download error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
