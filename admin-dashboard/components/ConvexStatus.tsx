"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect, useState } from "react";

export function ConvexStatus() {
  const config = useQuery(api.pricing.getActive, {});
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (config !== undefined) return;
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, [config]);

  if (config !== undefined) {
    return (
      <div className="convex-status convex-status--ok">
        Connected to Convex · {config.currency} · {config.bundleTiers?.length ?? 0} bundles
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="convex-status convex-status--error">
        Not connected — run START-BACKEND.bat, then refresh (F5)
      </div>
    );
  }

  return <div className="convex-status convex-status--loading">Connecting to Convex…</div>;
}
