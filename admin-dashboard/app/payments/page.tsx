"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { PageLoading } from "@/components/PageLoading";
import { useEffect, useState } from "react";

function money(value: number | undefined, currency: string) {
  return `${currency} ${(value ?? 0).toFixed(2)}`;
}

export default function PaymentsOverviewPage() {
  const overview = useQuery(api.admin.payments.getOverview, {});
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (overview !== undefined) return;
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [overview]);

  if (overview === undefined) {
    return (
      <>
        <PageLoading title="Loading overview" />
        {slow && (
          <div className="alert alert-warning" style={{ marginTop: 24 }}>
            <div>
              <strong>Still loading?</strong>
              <p>
                Start <strong>START-BACKEND.bat</strong> first, wait 10 seconds, then press F5 to
                refresh.
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  const currency = overview.currency ?? "USD";

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Payments overview</h2>
          <p className="subtitle">Cash-on-delivery revenue and commission summary</p>
        </div>
      </header>

      <div className="grid-kpi">
        <div className="kpi-card">
          <div className="kpi-label">Cash revenue</div>
          <p className="kpi-value">{money(overview.cashRevenue, currency)}</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Platform commission</div>
          <p className="kpi-value">{money(overview.platformCommission, currency)}</p>
          <div className="kpi-sub">Settled: {money(overview.settledCommission, currency)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Outstanding commission</div>
          <p className="kpi-value">{money(overview.outstandingCommission, currency)}</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Paid orders</div>
          <p className="kpi-value">{overview.paidOrderCount ?? 0}</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Refunded orders</div>
          <p className="kpi-value">{overview.refundedOrderCount ?? 0}</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pending payouts</div>
          <p className="kpi-value">{overview.pendingPayoutCount ?? 0}</p>
          <div className="kpi-sub">{money(overview.pendingPayoutAmount, currency)}</div>
        </div>
      </div>
    </div>
  );
}
