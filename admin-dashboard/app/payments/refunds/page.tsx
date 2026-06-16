"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export default function RefundsPage() {
  const processRefund = useMutation(api.admin.payments.processRefund);
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await processRefund({
        orderId: orderId.trim() as Id<"orders">,
        amount: parseFloat(amount),
        reason: reason.trim(),
      });
      setMessage("Cash refund recorded.");
      setOrderId("");
      setAmount("");
      setReason("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Process refund</h1>
      <p className="muted">Record a cash refund for a paid order (handled offline).</p>
      <form className="card" style={{ maxWidth: 480, marginTop: 24 }} onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            Order ID
          </span>
          <input
            className="input"
            style={{ marginTop: 6 }}
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Convex order document id"
            required
          />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            Refund amount
          </span>
          <input
            className="input"
            style={{ marginTop: 6 }}
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            Reason
          </span>
          <input
            className="input"
            style={{ marginTop: 6 }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </label>
        {message && <p style={{ fontSize: 14 }}>{message}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Processing…" : "Record refund"}
        </button>
      </form>
    </div>
  );
}
