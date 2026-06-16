"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useState } from "react";
import { PageLoading } from "@/components/PageLoading";

export default function CommissionsPage() {
  const overview = useQuery(api.admin.commissions.getOverview, {});
  const pending = useQuery(api.admin.commissions.listPendingSettlements, {});
  const outstanding = useQuery(api.admin.commissions.listOutstandingByDriver, {});
  const confirmSettlement = useMutation(api.admin.commissions.confirmSettlement);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const handleConfirm = async (settlementId: string) => {
    setLoadingId(settlementId);
    setMessage("");
    try {
      await confirmSettlement({ settlementId: settlementId as any });
      setMessage("Commission payment confirmed.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoadingId(null);
    }
  };

  if (overview === undefined) {
    return <PageLoading title="Loading commissions" />;
  }

  const currency = overview.currency ?? "USD";

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Commission settlements</h2>
          <p className="subtitle">
            Drivers owe {overview.commissionPercent ?? 5}% per delivery · due within{" "}
            {overview.settlementCycleDays ?? 3} days
          </p>
        </div>
      </header>

      <div className="grid-kpi">
        <div className="kpi-card">
          <div className="kpi-label">Total earned</div>
          <p className="kpi-value">{currency} {(overview.totalCommission ?? 0).toFixed(2)}</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Settled</div>
          <p className="kpi-value">{currency} {(overview.settledCommission ?? 0).toFixed(2)}</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Outstanding</div>
          <p className="kpi-value">{currency} {(overview.outstandingCommission ?? 0).toFixed(2)}</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Overdue</div>
          <p className="kpi-value" style={{ color: "var(--error)" }}>
            {currency} {(overview.overdueCommission ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      {message && <p className="message message-success" style={{ marginTop: 24 }}>{message}</p>}

      <section style={{ marginTop: 40 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "1.125rem" }}>Pending driver payments</h3>
        {!pending?.length ? (
          <p className="muted">No pending commission payments.</p>
        ) : (
          <div className="stack">
            {pending.map((s) => (
              <div
                key={s._id}
                className="card"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}
              >
                <div>
                  <strong>{s.driverName}</strong>
                  <div className="muted" style={{ fontSize: "0.8125rem", marginTop: 4 }}>
                    {s.currency} {s.amount.toFixed(2)} · {s.orderIds.length} order(s) ·{" "}
                    {new Date(s.submittedAt).toLocaleString()}
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  disabled={loadingId === s._id}
                  onClick={() => handleConfirm(s._id)}
                >
                  {loadingId === s._id ? "Confirming…" : "Confirm received"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "1.125rem" }}>Outstanding by driver</h3>
        {!outstanding?.length ? (
          <p className="muted">All commission settled.</p>
        ) : (
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th style={{ textAlign: "right" }}>Orders</th>
                  <th style={{ textAlign: "right" }}>Outstanding</th>
                  <th style={{ textAlign: "right" }}>Overdue</th>
                </tr>
              </thead>
              <tbody>
                {outstanding.map((row) => (
                  <tr key={row.driverId}>
                    <td>{row.driverName}</td>
                    <td style={{ textAlign: "right" }}>{row.orderCount}</td>
                    <td style={{ textAlign: "right" }}>
                      {row.currency} {row.outstanding.toFixed(2)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: row.overdue > 0 ? "var(--error)" : undefined,
                        fontWeight: row.overdue > 0 ? 600 : undefined,
                      }}
                    >
                      {row.currency} {row.overdue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
