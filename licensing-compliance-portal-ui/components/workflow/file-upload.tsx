"use client";

import React, { useId, useMemo, useState } from "react";

type FileUploadProps = {
  label: string;
  description?: string;
  acceptedTypes?: string[];
  maxBytes?: number;
  onSelect?: (file: File) => void;
  onValidationError?: (message: string) => void;
};

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.ceil(bytes / 1024)} KB`;
}

export function FileUpload({
  label,
  description,
  acceptedTypes = ["application/pdf", "image/png", "image/jpeg"],
  maxBytes = 5 * 1024 * 1024,
  onSelect,
  onValidationError,
}: FileUploadProps) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const accept = useMemo(() => acceptedTypes.join(","), [acceptedTypes]);

  function reportError(message: string) {
    setError(message);
    onValidationError?.(message);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedName(null);
      setError(null);
      return;
    }

    if (file.size > maxBytes) {
      reportError(`File exceeds the ${formatBytes(maxBytes)} upload limit.`);
      setSelectedName(null);
      event.target.value = "";
      return;
    }

    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      reportError("This file type is not supported for this workflow step.");
      setSelectedName(null);
      event.target.value = "";
      return;
    }

    setError(null);
    setSelectedName(file.name);
    onSelect?.(file);
  }

  return (
    <div className="surface-panel rounded-[1.75rem] p-6">
      <div className="space-y-1">
        <label htmlFor={id} className="text-lg font-semibold text-[var(--bnr-text-primary)]">
          {label}
        </label>
        {description ? (
          <p className="text-sm leading-7 text-[var(--bnr-text-secondary)]">{description}</p>
        ) : null}
      </div>
      <div className="mt-5 rounded-[1.4rem] border border-dashed border-[var(--border)] bg-[var(--bnr-cream-light)]/50 p-5">
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="block w-full text-sm text-[var(--bnr-text-primary)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--bnr-brown)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--bnr-brown-600)]"
        />
        <p className="mt-3 text-xs uppercase tracking-[0.24em] text-[var(--bnr-text-secondary)]">
          Maximum {formatBytes(maxBytes)} · {acceptedTypes.join(", ")}
        </p>
        {selectedName ? (
          <p className="mt-4 text-sm font-medium text-[var(--bnr-text-primary)]">{selectedName}</p>
        ) : null}
        {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
