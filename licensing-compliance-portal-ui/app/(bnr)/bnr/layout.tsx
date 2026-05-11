import { PortalShell } from "@/components/layout/portal-shell";
import { requireBnrSession } from "@/lib/auth";

export default async function BnrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireBnrSession();

  const navItems = [
    { label: "Dashboard", href: "/bnr/dashboard" },
    { label: "Application Queue", href: "/bnr/applications" },
  ];

  if (user.role === "ADMIN" || user.role === "AUDITOR") {
    navItems.push({ label: "Audit Trail", href: "/bnr/audit" });
  }

  if (user.role === "ADMIN") {
    navItems.push({ label: "User Management", href: "/bnr/users" });
  }

  return (
    <PortalShell
      user={user}
      eyebrow="BNR Internal Portal"
      title="Licensing & Compliance Operations"
      navItems={navItems}
    >
      {children}
    </PortalShell>
  );
}
