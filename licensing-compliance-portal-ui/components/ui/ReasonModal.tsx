"use client";

import { useState, useEffect } from "react";
import { ConfirmationModal } from "./ConfirmationModal";

interface ReasonModalProps {
  isOpen: boolean;
  title: string; // e.g. "Reject Institution Name"
  actionLabel: string; // e.g. "Reject Name"
  placeholder: string; // e.g. "Provide a reason for rejection..."
  minLength?: number; // default: 20 characters
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
  variant?: "danger" | "warning"; // danger = red button, warning = amber
}

export function ReasonModal({
  isOpen,
  title,
  actionLabel,
  placeholder,
  minLength = 20,
  onConfirm,
  onCancel,
  variant = "danger",
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (reason.length < minLength) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const isValid = reason.length >= minLength;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={handleConfirm}
      title={title}
      confirmLabel={actionLabel}
      isDestructive={variant === "danger"}
      isLoading={isSubmitting}
      isConfirmDisabled={!isValid}
      body={
        <div className="space-y-4">
          <p className="text-sm text-[var(--bnr-text-secondary)]">
            This reason will be visible to the applicant.
          </p>
          <div className="space-y-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={placeholder}
              className="input-field w-full min-h-[120px] rounded-[4px] text-sm"
              required
            />
            <div className="flex justify-between items-center">
              <span
                className={`text-xs font-medium ${
                  isValid ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {reason.length} / {minLength} minimum
              </span>
            </div>
          </div>
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      }
    />
  );
}
