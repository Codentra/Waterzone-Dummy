"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useState } from "react";

type Props = {
  driverId: Id<"drivers">;
  onClose: () => void;
  onAction: (message: string) => void;
};

export function DriverReviewModal({ driverId, onClose, onAction }: Props) {
  const review = useQuery(api.admin.drivers.getDriverReview, { driverId });
  const approveDriver = useMutation(api.admin.drivers.approveDriver);
  const rejectDriver = useMutation(api.admin.drivers.rejectDriver);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveDriver({ driverId });
      onAction("Driver approved.");
      onClose();
    } catch (err) {
      onAction(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      onAction("Rejection reason is required.");
      return;
    }
    setLoading(true);
    try {
      await rejectDriver({ driverId, rejectionReason: rejectReason.trim() });
      onAction("Driver rejected.");
      onClose();
    } catch (err) {
      onAction(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setLoading(false);
    }
  };

  if (review === undefined) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <p className="muted">Loading driver review…</p>
        </div>
      </div>
    );
  }

  const profile = review.profile;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel modal-panel-wide" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h3>{review.fullName}</h3>
            <p className="subtitle">
              {review.phoneE164} · {review.vehiclePlate} · {review.vehicleType}
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </header>

        {!review.hasCompleteProfile ? (
          <p className="alert alert-warning">
            Legacy registration — no structured profile or documents on file.
          </p>
        ) : (
          <div className="review-grid">
            <section className="card">
              <h4>Profile & vehicle</h4>
              {profile ? (
                <dl className="detail-list">
                  <div>
                    <dt>National ID</dt>
                    <dd>{profile.nationalIdNumber}</dd>
                  </div>
                  <div>
                    <dt>Date of birth</dt>
                    <dd>{profile.dateOfBirth}</dd>
                  </div>
                  <div>
                    <dt>Home address</dt>
                    <dd>{profile.homeAddress}</dd>
                  </div>
                  <div>
                    <dt>Emergency contact</dt>
                    <dd>
                      {profile.emergencyContactName} · {profile.emergencyContactPhone}
                    </dd>
                  </div>
                  <div>
                    <dt>Vehicle</dt>
                    <dd>
                      {profile.vehicleMakeModel}
                      {profile.vehicleColour ? ` · ${profile.vehicleColour}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>Tank capacity</dt>
                    <dd>{profile.tankCapacityLitres.toLocaleString()} L</dd>
                  </div>
                </dl>
              ) : (
                <p className="muted">No profile data.</p>
              )}
            </section>

            <section className="card">
              <h4>Documents</h4>
              {!review.documents.length ? (
                <p className="muted">No documents uploaded.</p>
              ) : (
                <div className="doc-grid">
                  {review.documents.map((doc) => (
                    <div key={doc.key} className="doc-card">
                      <p className="doc-label">{doc.label}</p>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          {doc.url.match(/\.pdf|pdf/i) ? (
                            <span className="doc-link">Open PDF</span>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={doc.url} alt={doc.label} className="doc-thumb" />
                          )}
                        </a>
                      ) : (
                        <span className="muted">Unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {review.verificationStatus === "pending" && review.hasCompleteProfile && (
          <footer className="modal-footer">
            {!showReject ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={loading}
                  onClick={handleApprove}
                >
                  Approve driver
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={loading}
                  onClick={() => setShowReject(true)}
                >
                  Reject
                </button>
              </>
            ) : (
              <div className="reject-form">
                <label htmlFor="reject-reason">Rejection reason (required)</label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain what needs to be corrected…"
                />
                <div className="reject-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={loading}
                    onClick={handleReject}
                  >
                    Confirm reject
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={loading}
                    onClick={() => setShowReject(false)}
                  >
                    Cancel
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
