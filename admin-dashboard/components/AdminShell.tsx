"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAYMENT_LINKS = [
  { href: "/payments", label: "Overview" },
  { href: "/payments/commissions", label: "Commissions" },
  { href: "/payments/settings/pricing", label: "Bundle pricing" },
  { href: "/payments/history", label: "History" },
  { href: "/payments/wallets", label: "Wallets" },
  { href: "/payments/payouts", label: "Payouts" },
  { href: "/payments/refunds", label: "Refunds" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Waterzone</h1>
          <p>Admin · Payments</p>
        </div>
        <nav className="sidebar-nav">
          {PAYMENT_LINKS.map((link) => {
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
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
