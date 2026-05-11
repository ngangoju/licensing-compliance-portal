import React from "react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:                     { label: 'Draft',                  color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  NAME_APPROVAL_PENDING:     { label: 'Name Approval Pending',  color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  NAME_APPROVED:             { label: 'Name Approved',          color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  SUBMITTED:                 { label: 'Submitted',              color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  COMPLETENESS_CHECK:        { label: 'Completeness Check',     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  INCOMPLETE:                { label: 'Incomplete',             color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  CASE_ASSIGNED:             { label: 'Case Assigned',          color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  FIT_AND_PROPER_ASSESSMENT: { label: 'F&P Assessment',         color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
  TECHNICAL_REVIEW:          { label: 'Technical Review',       color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
  ADDITIONAL_INFO_REQUESTED: { label: 'Info Requested',         color: '#EA580C', bg: 'rgba(234,88,12,0.12)' },
  LEGAL_REVIEW:              { label: 'Legal Review',           color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  COMMITTEE_DELIBERATION:    { label: 'Committee Review',       color: '#BE185D', bg: 'rgba(190,24,93,0.12)' },
  APPROVAL_IN_PRINCIPLE:     { label: 'Approval In Principle',  color: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
  ORGANIZATION_PERIOD:       { label: 'Organisation Period',    color: '#0369A1', bg: 'rgba(3,105,161,0.12)' },
  PRE_LICENSE_INSPECTION:    { label: 'Pre-Licence Inspection', color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)' },
  INSPECTION_FAILED:         { label: 'Inspection Failed',      color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  LICENSE_FEE_PENDING:       { label: 'Licence Fee Pending',    color: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
  LICENSED:                  { label: 'Licensed',               color: '#16A34A', bg: 'rgba(22,163,74,0.12)' },
  REJECTED:                  { label: 'Rejected',               color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  WITHDRAWN:                 { label: 'Withdrawn',              color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  AIP_EXPIRED:               { label: 'AIP Expired',            color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status.replace(/_/g, ' '),
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.12)'
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-[10px] py-[2px] text-[11px] font-semibold uppercase tracking-[0.06em] whitespace-nowrap",
        className
      )}
      style={{
        color: config.color,
        backgroundColor: config.bg,
      }}
    >
      {config.label}
    </span>
  );
}
