"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export default function PayoutsPage() {
  const payouts = useQuery(api.admin.payments.listPayouts, { status: "pending" });
  const approvePayout = useMutation(api.admin.payments.approvePayout);
  const rejectPayout = useMutation(api.admin.payments.rejectPayout);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const handleApprove = async (payoutId: Id<"payoutRequests">) => {
    setLoadingId(payoutId);
    setMessage("");
    try {
      await approvePayout({
        payoutId,
        providerRef: "manual-cash-handoff",
      });
      setMessage("Payout approved and wallet debited.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (payoutId: Id<"payoutRequests">) => {
    const reason = prompt("Rejection reason?")?.trim();
    if (!reason) return;
    setLoadingId(payoutId);
    setMessage("");
    try {
      await rejectPayout({
        payoutId,
        rejectionReason: reason,
      });
      setMessage("Payout rejected.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Driver payouts</h1>
      <p className="muted">Approve pending payout requests after manual cash/bank handoff.</p>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
      {payouts === undefined ? (
        <p className="muted">Loading…</p>
      ) : payouts.length === 0 ? (
        <p className="muted">No pending payouts.</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "auto", marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Plate</th>
                <th>Amount</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p._id}>
                  <td>{p.userName}</td>
                  <td>{p.driverPlate}</td>
                  <td>
                    {p.currency} {p.amount.toFixed(2)}
                  </td>
                  <td>{new Date(p.requestedAt).toLocaleString()}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      disabled={loadingId === p._id}
                      onClick={() => handleApprove(p._id)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={loadingId === p._id}
                      onClick={() => handleReject(p._id)}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
