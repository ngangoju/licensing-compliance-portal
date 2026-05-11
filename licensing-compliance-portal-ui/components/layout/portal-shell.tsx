import { type SessionUser } from "@/lib/auth-shared";
import { SignOutButton } from "@/components/layout/sign-out-button";

type PortalShellProps = {
  user: SessionUser;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  navItems?: { label: string; href: string }[];
};

export function PortalShell({ user, title, eyebrow, children, navItems }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bnr-cream-50)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-lg bg-[var(--bnr-brown)] overflow-hidden shadow-none">
          <div className="px-6 pt-6 sm:px-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between pb-6 border-b border-[var(--bnr-brown-500)]">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--bnr-gold)]">
                {eyebrow}
              </p>
              <h1 className="font-display text-[28px] font-semibold text-white">{title}</h1>
              <p className="text-[14px] text-[rgba(255,255,255,0.8)]">
                Signed in as {user.fullName} · {user.role.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 text-[13px] font-medium text-[var(--bnr-cream)] border-r border-[var(--bnr-brown-500)]">
                {user.organisation || user.email}
              </div>
              <SignOutButton />
            </div>
          </div>
          {navItems && navItems.length > 0 && (
            <div className="flex gap-6 px-6 sm:px-8 bg-[var(--bnr-brown-700)]">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-4 py-4 text-[14px] font-semibold text-[var(--bnr-cream-light)] hover:text-white border-b-[3px] border-transparent hover:border-[var(--bnr-gold)] transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
