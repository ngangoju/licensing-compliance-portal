"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDraftApplication } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const LICENSE_TYPES = [
  { value: "COMMERCIAL_BANK", label: "Commercial Bank" },
  { value: "MICROFINANCE_INSTITUTION_TIER1", label: "Microfinance Institution (Tier 1)" },
  { value: "MICROFINANCE_INSTITUTION_TIER2", label: "Microfinance Institution (Tier 2)" },
  { value: "SAVINGS_CREDIT_COOPERATIVE", label: "Savings & Credit Cooperative" },
  { value: "FOREX_BUREAU", label: "Forex Bureau" },
  { value: "PAYMENT_SERVICE_PROVIDER", label: "Payment Service Provider" },
  { value: "DEVELOPMENT_FINANCE_INSTITUTION", label: "Development Finance Institution" },
  { value: "REPRESENTATIVE_OFFICE", label: "Representative Office" },
];

export function NewApplicationForm({ token }: { token: string }) {
  const router = useRouter();
  const [proposedName, setProposedName] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [proposedCapitalRwf, setProposedCapitalRwf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proposedName.trim() || !licenseType || !proposedCapitalRwf.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await createDraftApplication(token, { 
        proposedName, 
        licenseType, 
        proposedCapitalRwf: parseInt(proposedCapitalRwf.replace(/,/g, ''), 10) || 0
      });
      router.push("/applicant/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="proposedName" className="text-sm font-medium text-[var(--bnr-text-primary)]">
          Proposed Institution Name
        </Label>
        <Input
          id="proposedName"
          type="text"
          placeholder="e.g. Kigali Capital Bank PLC"
          value={proposedName}
          onChange={(e) => setProposedName(e.target.value)}
          required
          className="rounded-sm"
        />
        <p className="text-xs text-[var(--bnr-text-secondary)]">
          The name under which you propose to incorporate the institution.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="licenseType" className="text-sm font-medium text-[var(--bnr-text-primary)]">
          License Type
        </Label>
        <select
          id="licenseType"
          value={licenseType}
          onChange={(e) => setLicenseType(e.target.value)}
          required
          className="w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-[var(--bnr-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--bnr-brown)] focus:border-transparent"
        >
          <option value="">Select a license type...</option>
          {LICENSE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--bnr-text-secondary)]">
          Choose the type of financial institution you wish to establish.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposedCapitalRwf" className="text-sm font-medium text-[var(--bnr-text-primary)]">
          Proposed Capital (RWF)
        </Label>
        <Input
          id="proposedCapitalRwf"
          type="number"
          placeholder="e.g. 5000000000"
          value={proposedCapitalRwf}
          onChange={(e) => setProposedCapitalRwf(e.target.value)}
          required
          className="rounded-sm"
          min="0"
        />
        <p className="text-xs text-[var(--bnr-text-secondary)]">
          Enter the initial paid-up capital in Rwandan Francs (RWF).
        </p>
      </div>

      {error && (
        <div className="rounded-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading || !proposedName.trim() || !licenseType}>
          {loading ? "Saving Draft..." : "Save Draft & Continue"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
