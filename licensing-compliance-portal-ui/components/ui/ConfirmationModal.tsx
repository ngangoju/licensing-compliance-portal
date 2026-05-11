"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: React.ReactNode;
  confirmPhrase?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  isConfirmDisabled?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  body,
  confirmPhrase,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isLoading = false,
  isConfirmDisabled = false,
}: ConfirmationModalProps) {
  const [typedPhrase, setTypedPhrase] = useState("");

  // Reset input when opened
  useEffect(() => {
    if (isOpen) {
      setTypedPhrase("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const finalConfirmDisabled = isConfirmDisabled || (confirmPhrase 
    ? typedPhrase !== confirmPhrase 
    : false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#3D1C00] bg-opacity-50 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-[480px] rounded-lg bg-white p-8 shadow-[0_1px_8px_rgba(61,28,0,0.08)]">
        <h2 className="font-display text-[22px] font-bold text-[var(--bnr-text)] mb-4">
          {title}
        </h2>
        
        <div className="mb-6 text-[15px] text-[var(--bnr-text-muted)] space-y-4">
          {body}
        </div>

        {confirmPhrase && (
          <div className="mb-8 bg-[var(--bnr-cream-50)] p-4 rounded border border-[#E8DCC8]">
            <label className="block text-[13px] font-semibold uppercase tracking-wide text-[var(--bnr-text)] mb-2">
              Type &quot;{confirmPhrase}&quot; to continue
            </label>
            <Input
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={confirmPhrase}
              autoComplete="off"
              disabled={isLoading}
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant={isDestructive ? "destructive" : "primary"} 
            onClick={onConfirm}
            disabled={finalConfirmDisabled || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
