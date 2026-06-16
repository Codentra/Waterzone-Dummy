"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

export default function HistoryPage() {
  const [status, setStatus] = useState("");
  const history = useQuery(api.admin.payments.listHistory, {
    paymentStatus: status || undefined,
  });

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Payment history</h1>
      <p className="muted">Cash orders and wallet movements</p>
      <div style={{ marginBottom: 16 }}>
        <select
          className="input"
          style={{ maxWidth: 200 }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All payment statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      {history === undefined ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Details</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) =>
                row.kind === "order" ? (
                  <tr key={`order-${row.orderId}`}>
                    <td>Cash order</td>
                    <td>
                      {row.customerName} · {row.litres}L · {row.paymentStatus}
                      {row.driverName ? ` · ${row.driverName}` : ""}
                    </td>
                    <td>{row.total.toFixed(2)}</td>
                    <td>{formatDate(row.paidAt ?? row.createdAt)}</td>
                  </tr>
                ) : (
                  <tr key={`txn-${row.transactionId}`}>
                    <td>Wallet {row.type}</td>
                    <td>
                      {row.userName} · {row.reason}
                    </td>
                    <td>
                      {row.type === "credit" ? "+" : "-"}
                      {row.amount.toFixed(2)}
                    </td>
                    <td>{formatDate(row.createdAt)}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString();
}
