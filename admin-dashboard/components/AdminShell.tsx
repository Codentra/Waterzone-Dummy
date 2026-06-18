"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const OPERATIONS_LINKS = [{ href: "/drivers", label: "Drivers" }];

const PAYMENT_LINKS = [
  { href: "/payments", label: "Overview" },
  { href: "/payments/commissions", label: "Commissions" },
  { href: "/payments/settings/pricing", label: "Bundle pricing" },
  { href: "/payments/history", label: "History" },
  { href: "/payments/wallets", label: "Wallets" },
  { href: "/payments/payouts", label: "Payouts" },
  { href: "/payments/refunds", label: "Refunds" },
];

function NavSection({
  title,
  links,
  pathname,
}: {
  title: string;
  links: { href: string; label: string }[];
  pathname: string;
}) {
  return (
    <div className="nav-section">
      <p className="nav-section-title">{title}</p>
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/payments" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link${active ? " active" : ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Waterzone</h1>
          <p>Admin</p>
        </div>
        <nav className="sidebar-nav">
          <NavSection title="Operations" links={OPERATIONS_LINKS} pathname={pathname} />
          <NavSection title="Payments & Finance" links={PAYMENT_LINKS} pathname={pathname} />
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
