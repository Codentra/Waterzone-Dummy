import { Providers } from "@/providers/Providers";
import { ConvexStatus } from "@/components/ConvexStatus";
import "./globals.css";

export const metadata = {
  title: "Waterzone Admin",
  description: "Payments and finance dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          body { margin: 0; font-family: system-ui, sans-serif; background: #f1f5f9; color: #0f172a; }
          .app-shell { display: flex; min-height: 100vh; }
          .sidebar { width: 260px; background: #fff; border-right: 1px solid #e2e8f0; flex-shrink: 0; }
          .sidebar-brand { padding: 24px 20px; border-bottom: 1px solid #e2e8f0; }
          .sidebar-brand h1 { margin: 0; font-size: 1.25rem; color: #0a7ea4; }
          .sidebar-brand p { margin: 4px 0 0; font-size: 0.8125rem; color: #64748b; }
          .sidebar-nav { padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
          .nav-link { display: block; padding: 10px 14px; border-radius: 8px; color: #64748b; text-decoration: none; }
          .nav-link.active { background: #e0f2fe; color: #086888; font-weight: 600; }
          .main-content { flex: 1; padding: 32px 40px; }
          .convex-status { padding: 10px 20px; font-size: 0.8125rem; font-weight: 500; }
          .convex-status--ok { background: #dcfce7; color: #166534; }
          .convex-status--error { background: #fee2e2; color: #991b1b; }
          .convex-status--loading { background: #e0f2fe; color: #0369a1; }
        `}</style>
      </head>
      <body>
        <Providers>
          <ConvexStatus />
          {children}
        </Providers>
      </body>
    </html>
  );
}
