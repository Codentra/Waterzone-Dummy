"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useState } from "react";

type Props = {
  orderId: Id<"orders">;
  onClose: () => void;
  onAction: (message: string) => void;
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function OrderDetailModal({ orderId, onClose, onAction }: Props) {
  const detail = useQuery(api.admin.orders.getOrderDetail, { orderId });
  const cancelOrder = useMutation(api.admin.orders.cancelOrder);
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelOrder({ orderId });
      onAction("Order cancelled.");
      onClose();
    } catch (err) {
      onAction(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setLoading(false);
      setConfirmCancel(false);
    }
  };

  if (detail === undefined) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <p className="muted">Loading order…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel modal-panel-wide" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h3>Order · {detail.litres.toLocaleString()} L</h3>
            <p className="subtitle">
              {detail.status} · {detail.paymentStatus} · {detail.currency}{" "}
              {detail.total.toFixed(2)}
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="review-grid">
          <section className="card">
            <h4>Delivery</h4>
            <dl className="detail-list">
              <div>
                <dt>Customer</dt>
                <dd>
                  {detail.customer?.name ?? "Unknown"}
                  {detail.customer?.phone ? ` · ${detail.customer.phone}` : ""}
                </dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{detail.addressText}</dd>
              </div>
              {detail.notes ? (
                <div>
                  <dt>Notes</dt>
                  <dd>{detail.notes}</dd>
                </div>
              ) : null}
              <div>
                <dt>Driver</dt>
                <dd>
                  {detail.driver
                    ? `${detail.driver.name} · ${detail.driver.plate} (${detail.driver.vehicleType})`
                    : "Unassigned"}
                </dd>
              </div>
              <div>
                <dt>Pricing</dt>
                <dd>
                  Total {detail.currency} {detail.total.toFixed(2)} · Driver{" "}
                  {detail.driverEarnings.toFixed(2)} · Platform {detail.fee.toFixed(2)}
                </dd>
              </div>
              {detail.cashReceivedAmount != null ? (
                <div>
                  <dt>Cash received</dt>
                  <dd>
                    {detail.currency} {detail.cashReceivedAmount.toFixed(2)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="card">
            <h4>Timeline</h4>
            {!detail.timeline.length ? (
              <p className="muted">No events yet.</p>
            ) : (
              <ol className="timeline-list">
                {detail.timeline.map((event) => (
                  <li key={event.key}>
                    <span className="timeline-label">{event.label}</span>
                    <span className="timeline-time">{formatDate(event.at!)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {detail.canCancel && (
          <footer className="modal-footer">
            {!confirmCancel ? (
              <button
                type="button"
                className="btn btn-danger"
                disabled={loading}
                onClick={() => setConfirmCancel(true)}
              >
                Cancel order
              </button>
            ) : (
              <div className="reject-form">
                <p>Cancel this order? The customer and driver will see it as cancelled.</p>
                <div className="reject-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={loading}
                    onClick={handleCancel}
                  >
                    Confirm cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={loading}
                    onClick={() => setConfirmCancel(false)}
                  >
                    Keep order
                  </button>
                </div>
              </div>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
