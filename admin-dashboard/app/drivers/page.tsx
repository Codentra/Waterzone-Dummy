"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useState } from "react";
import { DriverReviewModal } from "@/components/DriverReviewModal";
import { PageLoading } from "@/components/PageLoading";

type Filter = "pending" | "approved" | "rejected" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function statusBadge(status: string) {
  const cls =
    status === "approved"
      ? "badge badge-success"
      : status === "rejected"
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

export default function DriversPage() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [reviewId, setReviewId] = useState<Id<"drivers"> | null>(null);
  const [message, setMessage] = useState("");

  const data = useQuery(api.admin.drivers.listDrivers, { verificationStatus: filter });

  if (data === undefined) {
    return <PageLoading title="Loading drivers" />;
  }

  const { drivers, counts } = data;

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Driver management</h2>
          <p className="subtitle">
            Review driver applications, documents, and approve or reject before they can go online.
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

      {!drivers.length ? (
        <div className="card">
          <p className="muted">
            {filter === "pending"
              ? "No drivers awaiting approval."
              : `No ${filter === "all" ? "" : filter} drivers found.`}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Vehicle</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.driverId}>
                  <td>{d.fullName}</td>
                  <td>{d.phoneE164}</td>
                  <td>
                    {d.vehiclePlate} · {d.vehicleType}
                  </td>
                  <td>{formatDate(d.createdAt)}</td>
                  <td>{statusBadge(d.verificationStatus)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setReviewId(d.driverId)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reviewId && (
        <DriverReviewModal
          driverId={reviewId}
          onClose={() => setReviewId(null)}
          onAction={setMessage}
        />
      )}
    </div>
  );
}
