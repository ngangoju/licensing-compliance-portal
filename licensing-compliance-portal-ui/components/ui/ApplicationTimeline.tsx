import React from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  description: string;
  previousState?: string;
  newState?: string;
  type: "STATE_TRANSITION" | "DOCUMENT" | "REQUEST" | "DECISION" | "NOTE";
}

interface ApplicationTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function ApplicationTimeline({ events, className }: ApplicationTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-sm text-[var(--bnr-text-muted)] italic">
        No events recorded yet.
      </div>
    );
  }

  const getNodeColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "STATE_TRANSITION": return "bg-[var(--bnr-gold)]";
      case "DOCUMENT": return "bg-blue-500";
      case "REQUEST": return "bg-amber-500";
      case "DECISION": return "bg-green-600";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className={cn("relative pl-4 border-l border-[#E8DCC8] ml-2 space-y-8", className)}>
      {events.map((event, index) => (
        <div key={event.id || index} className="relative">
          <div className={cn(
            "absolute -left-[21px] top-1 h-[10px] w-[10px] rounded-full border-2 border-white",
            getNodeColor(event.type)
          )} />
          
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="font-mono text-[var(--bnr-text-muted)]">
                {event.timestamp}
              </span>
              <span className="text-gray-300">&middot;</span>
              <span className="font-semibold text-[var(--bnr-text)]">{event.actorName}</span>
              <span className="rounded-full bg-[var(--bnr-cream)] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[var(--bnr-brown-500)] uppercase">
                {event.actorRole.replace(/_/g, ' ')}
              </span>
            </div>
            
            <div className="text-[14px] font-bold text-[var(--bnr-text)]">
              {event.action}
            </div>
            
            {event.description && (
              <div className="text-[14px] text-[var(--bnr-text-muted)] mt-1">
                {event.description}
              </div>
            )}
            
            {event.previousState && event.newState && event.previousState !== event.newState && (
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={event.previousState} />
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
                <StatusBadge status={event.newState} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
