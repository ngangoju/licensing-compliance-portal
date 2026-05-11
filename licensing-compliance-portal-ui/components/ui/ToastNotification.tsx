"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "warning" | "error";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 bg-white p-4 rounded-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] min-w-[300px] pointer-events-auto transform transition-all duration-300 translate-x-0 opacity-100",
              toast.type === "success" && "border-l-[3px] border-l-green-600",
              toast.type === "warning" && "border-l-[3px] border-l-amber-500",
              toast.type === "error" && "border-l-[3px] border-l-red-600"
            )}
          >
            {toast.type === "success" && (
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === "warning" && (
              <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.type === "error" && (
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-[14px] text-[var(--bnr-text)] font-medium">
              {toast.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
