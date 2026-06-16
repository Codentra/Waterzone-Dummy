"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: { children: React.ReactNode }) {
  if (!convexUrl || !convex) {
    return (
      <div style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
        <h2>Convex not linked</h2>
        <p>
          Run <code>scripts\sync-convex-env.cmd</code> or add{" "}
          <code>NEXT_PUBLIC_CONVEX_URL</code> to <code>admin-dashboard\.env.local</code>
        </p>
        <p className="muted" style={{ fontSize: 14 }}>
          Example: NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
        </p>
      </div>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
