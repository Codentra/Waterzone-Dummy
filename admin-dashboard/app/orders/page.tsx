"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useState } from "react";
import { OrderDetailModal } from "@/components/OrderDetailModal";
import { PageLoading } from "@/components/PageLoading";

type Filter = "active" | "delivered" | "cancelled" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

function statusBadge(status: string) {
  const cls =
    status === "delivered"
      ? "badge badge-success"
      : status === "cancelled"
        ? "badge badge-error"
        : "badge badge-warning";
  return <span className={cls}>{status}</span>;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function truncateAddress(text: string, max = 40) {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

export default function OrdersPage() {
  const [filter, setFilter] = useState<Filter>("active");
  const [viewId, setViewId] = useState<Id<"orders"> | null>(null);
  const [message, setMessage] = useState("");

  const data = useQuery(api.admin.orders.listOrders, { filter });

  if (data === undefined) {
    return <PageLoading title="Loading orders" />;
  }

  const { orders, counts, currency } = data;

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Order management</h2>
          <p className="subtitle">
            Monitor active deliveries, review timelines, and cancel stuck orders when no driver
            is available.
          </p>
        </div>
      </header>

      {message && (
        <p className="message message-success" style={{ marginBottom: 20 }}>
          {message}
        </p>
      )}

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`filter-tab${filter === f.key ? " active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="filter-count">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {!orders.length ? (
        <div className="card">
          <p className="muted">
            {filter === "active" ? "No active orders." : `No ${filter === "all" ? "" : filter} orders found.`}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Bundle</th>
                <th>Total</th>
                <th>Address</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderId}>
                  <td>{o.customerName}</td>
                  <td>{o.litres.toLocaleString()} L</td>
                  <td>
                    {currency} {o.total.toFixed(2)}
                  </td>
                  <td>{truncateAddress(o.addressText)}</td>
                  <td>{o.driverName ? `${o.driverName} · ${o.driverPlate}` : "Unassigned"}</td>
                  <td>{statusBadge(o.status)}</td>
                  <td>{formatDate(o.requestedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setViewId(o.orderId)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewId && (
        <OrderDetailModal
          orderId={viewId}
          onClose={() => setViewId(null)}
          onAction={setMessage}
        />
      )}
    </div>
  );
}
