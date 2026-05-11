import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-6 flex h-12 w-12 items-center justify-center text-[var(--bnr-brown-300)] [&>svg]:h-12 [&>svg]:w-12">
          {icon}
        </div>
      )}
      <h3 className="font-display text-[20px] font-medium text-[var(--bnr-text)]">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-2 max-w-sm text-[14px] text-[var(--bnr-text-muted)]">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
