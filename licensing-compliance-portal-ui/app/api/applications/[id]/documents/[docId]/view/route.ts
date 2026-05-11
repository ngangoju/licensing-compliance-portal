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

    // Forward the request to the backend view endpoint
    const backendUrl = buildApiUrl(`/applications/${id}/documents/${docId}/view`);
    console.log(`[Proxy View] Calling backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`[Proxy View] Backend returned ${response.status}`);
      return new NextResponse("Document not found or access denied", { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = response.headers.get("content-disposition") || "inline";

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "private, max-age=3600",
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (err: unknown) {
    console.error("[Proxy View] Fatal error:", err);
    return new NextResponse(`Internal Server Error: ${err instanceof Error ? err.message : "Unknown error"}`, { status: 500 });
  }
}
