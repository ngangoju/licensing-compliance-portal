"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  label: string;
  href?: string; // if provided, use router.push(href); otherwise router.back()
}

export function BackButton({ label, href }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      className="inline-flex items-center gap-1.5 text-sm font-semibold
                 text-[var(--bnr-text-muted)] hover:text-[var(--bnr-brown)]
                 transition-colors duration-150 mb-6 group"
    >
      <ChevronLeft
        size={16}
        className="group-hover:-translate-x-0.5 transition-transform duration-150"
      />
      {label}
    </button>
  );
}
