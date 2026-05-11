import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildApiUrl } from "@/lib/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentType = request.nextUrl.searchParams.get("documentType");
    
    if (!documentType) {
      return NextResponse.json({ error: "documentType is required" }, { status: 400 });
    }

    const token = cookies().get("accessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Read the form data from the incoming request
    const incomingData = await request.formData();
    const file = incomingData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert to ArrayBuffer then back to Blob to ensure content is preserved
    // and correctly serialized by the secondary fetch.
    const buffer = await file.arrayBuffer();
    console.log(`Proxy: Uploading file "${(file as File).name}" (${buffer.byteLength} bytes)`);
    
    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
    }

    const blob = new Blob([buffer], { type: file.type });
    const fileName = (file as File).name || "upload";

    // Rebuild FormData for forwarding
    const forwardData = new FormData();
    forwardData.append("file", blob, fileName);
    forwardData.append("documentType", documentType);

    // Forward the request to the backend
    const backendUrl = buildApiUrl(`/applications/${id}/documents`);
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: forwardData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || errorData?.message || "Backend upload failed";
      console.error("Backend upload failed:", response.status, errorData);
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Proxy upload error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
