import React from "react";
import { cn } from "@/lib/utils";

interface SlaWidgetProps {
  targetDays: number;
  usedDays: number;
  isPaused?: boolean;
  pauseReason?: string;
  className?: string;
}

export function SlaWidget({
  targetDays,
  usedDays,
  isPaused = false,
  pauseReason,
  className,
}: SlaWidgetProps) {
  const remainingDays = Math.max(0, targetDays - usedDays);
  const percentageUsed = Math.min(100, Math.max(0, (usedDays / targetDays) * 100));

  let colorClass = "text-green-600";
  let fillClass = "bg-green-600";
  
  if (remainingDays < 10) {
    colorClass = "text-red-600";
    fillClass = "bg-red-600";
  } else if (remainingDays <= 25) {
    colorClass = "text-amber-600";
    fillClass = "bg-amber-600";
  }

  if (isPaused) {
    colorClass = "text-amber-600";
  }

  return (
    <div className={cn("surface-panel p-6 flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--bnr-text-muted)]">
          SLA CLOCK
        </span>
        {isPaused && (
          <span className="font-mono text-[11px] font-bold tracking-widest text-amber-600 uppercase">
            PAUSED
          </span>
        )}
      </div>

      <div>
        <div className={cn("font-mono text-[28px] leading-none", colorClass)}>
          {remainingDays} working days
        </div>
        {isPaused && pauseReason && (
          <div className="mt-1 text-sm text-amber-600 font-medium">
            Reason: {pauseReason}
          </div>
        )}
      </div>

      <div className="h-[2px] w-full overflow-hidden bg-[#E8DCC8] rounded-full">
        <div
          className={cn("h-full transition-all duration-500", fillClass)}
          style={{ width: `${percentageUsed}%` }}
        />
      </div>

      <div className="text-[13px] text-[var(--bnr-text-muted)]">
        Target: {targetDays} working days &middot; Used: {usedDays}
      </div>
    </div>
  );
}
