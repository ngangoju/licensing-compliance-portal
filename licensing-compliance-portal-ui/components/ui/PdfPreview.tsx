"use client";

import React, { useEffect, useState } from "react";

interface PdfPreviewProps {
  src: string;
  title: string;
}

export function PdfPreview({ src, title }: PdfPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentUrl: string | null = null;

    async function fetchPdf() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(src);
        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}. ${errorText}`);
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error("The PDF file is empty.");
        }
        
        // Ensure the blob is explicitly treated as a PDF
        // Sometimes the proxy might return a generic type, so we override it here
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
        currentUrl = url;
        setBlobUrl(url);
      } catch (err: unknown) {
        console.error("PDF Preview Error:", err);
        setError(err instanceof Error ? err.message : "An error occurred while loading the PDF.");
      } finally {
        setLoading(false);
      }
    }

    fetchPdf();

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 w-full h-full bg-stone-100 rounded-lg min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[var(--bnr-gold)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-stone-600 font-medium">Preparing document preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12 w-full h-full bg-stone-100 rounded-lg min-h-[400px]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-auto">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h4 className="text-lg font-bold text-[var(--bnr-text-primary)] mb-2">Preview Failed</h4>
          <p className="text-sm text-[var(--bnr-text-secondary)] mb-6">{error}</p>
        </div>
      </div>
    );
  }

  if (!blobUrl) return null;

  return (
    <div className="w-full h-full flex flex-col bg-stone-800 rounded-lg overflow-hidden min-h-[600px]">
      <object
        data={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
        type="application/pdf"
        className="w-full h-full border-0"
      >
        <iframe
          src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          className="w-full h-full border-0"
          title={title}
        >
          <div className="p-12 text-center text-white">
            <p className="mb-4">It looks like your browser doesn&apos;t support inline PDFs.</p>
            <a 
              href={src.replace("/view", "/download")} 
              className="inline-block px-6 py-2 bg-[var(--bnr-gold)] text-white rounded-lg font-medium"
            >
              Download PDF Instead
            </a>
          </div>
        </iframe>
      </object>
    </div>
  );
}
