"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ApplicationStatus } from "@/types";

interface DocumentUploadZoneProps {
  documentType: string;
  applicationId: string;
  onUploadSuccess?: () => void;
  isUploaded?: boolean;
  uploadedFilename?: string;
  uploadedDate?: string;
  className?: string;
  disabled?: boolean;
  appStatus?: ApplicationStatus;
}

export function DocumentUploadZone({
  documentType,
  applicationId,
  onUploadSuccess,
  isUploaded = false,
  uploadedFilename,
  uploadedDate,
  className,
  disabled = false,
  appStatus,
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const WRITABLE_STAGES: ApplicationStatus[] = [
    "DRAFT",
    "NAME_APPROVED",
    "SUBMITTED",
    "INCOMPLETE",
    "ADDITIONAL_INFO_REQUESTED",
    "ORGANIZATION_PERIOD",
  ];

  const isBlocked = appStatus ? !WRITABLE_STAGES.includes(appStatus) : false;
  const isDisabled = disabled || isBlocked || isUploading;

  const handleFile = async (file: File) => {
    if (isDisabled) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB)");
      return;
    }
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png"
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Accepted: PDF, Word, JPEG, PNG");
      return;
    }

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/applications/${applicationId}/documents?documentType=${documentType}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    if (isDisabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    if (isDisabled) return;
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={cn(
        "rounded-[4px] border border-dashed p-6 text-center transition-colors",
        isDragging ? "border-[var(--bnr-brown-500)] bg-[var(--bnr-cream)]" : "border-[#D4C5A9] bg-[var(--bnr-cream-50)]",
        isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        className
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !isDisabled && fileInputRef.current?.click()}
    >
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
        accept=".pdf,.docx,.jpg,.jpeg,.png"
        disabled={isDisabled}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-[200px] h-[4px] bg-[#E8DCC8] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--bnr-gold)] animate-pulse w-1/2 rounded-full" />
          </div>
          <span className="text-[14px] text-[var(--bnr-text-muted)] font-medium">Uploading...</span>
        </div>
      ) : isUploaded ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-[14px] font-bold text-[var(--bnr-text)]">{uploadedFilename || "Document uploaded"}</div>
              {uploadedDate && <div className="text-[12px] text-[var(--bnr-text-muted)]">{uploadedDate}</div>}
            </div>
          </div>
          {!isBlocked && (
            <button
              type="button"
              className="text-[13px] font-semibold text-[var(--bnr-gold)] hover:underline"
              disabled={isDisabled}
            >
              Replace
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <svg className="h-6 w-6 text-[var(--bnr-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div className="text-[14px] text-[var(--bnr-text-muted)]">
            Drop file here or <span className="font-semibold text-[var(--bnr-brown)]">click to browse</span>
          </div>
          <div className="text-[12px] text-[#A89070]">PDF, Word, JPEG or PNG &middot; Max 5MB</div>
        </div>
      )}

      {isBlocked && !isUploaded && (
        <div className="mt-4 p-3 rounded-[4px] bg-red-50 border border-red-100 flex items-center justify-center gap-2 text-red-700">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-[12px] font-medium leading-tight">
            Uploads are restricted in the current stage ({appStatus?.replace(/_/g, " ") || "Review"}).
          </span>
        </div>
      )}

      {error && !isBlocked && (
        <div className="mt-4 flex items-center justify-center gap-2 text-red-600">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-[13px] font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
