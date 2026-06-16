"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { PageLoading } from "@/components/PageLoading";

type BundleTier = {
  litres: string;
  price: string;
};

const DEFAULT_BUNDLES: BundleTier[] = [
  { litres: "2500", price: "35" },
  { litres: "5000", price: "45" },
  { litres: "7500", price: "65" },
];

const emptyBundle = (): BundleTier => ({ litres: "", price: "" });

function parseBundles(tiers: BundleTier[]) {
  return tiers
    .filter((tier) => tier.litres && tier.price)
    .map((tier) => ({
      litres: parseFloat(tier.litres),
      price: parseFloat(tier.price),
    }))
    .sort((a, b) => a.litres - b.litres);
}

function formatLitres(litres: number) {
  return litres.toLocaleString();
}

export default function PricingSettingsPage() {
  const config = useQuery(api.admin.pricing.getConfig, {});
  const updateConfig = useMutation(api.admin.pricing.updateConfig);
  const seedDefaults = useMutation(api.admin.pricing.seedDefaults);

  const [bundleTiers, setBundleTiers] = useState<BundleTier[]>(DEFAULT_BUNDLES);
  const [commissionPercent, setCommissionPercent] = useState("5");
  const [settlementDays, setSettlementDays] = useState("3");
  const [previewLitres, setPreviewLitres] = useState("2500");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!config) return;
    const tiers = config.bundleTiers ?? [];
    if (tiers.length > 0) {
      setBundleTiers(
        tiers.map((tier) => ({
          litres: String(tier.litres),
          price: String(tier.price),
        }))
      );
      setPreviewLitres(String(tiers[0].litres));
    }
    const commission =
      config.platformCommissionPercent ??
      (config as { platformFeePercent?: number }).platformFeePercent ??
      5;
    setCommissionPercent(String(commission));
    setSettlementDays(String(config.settlementCycleDays ?? 3));
    setHydrated(true);
  }, [config]);

  const parsedBundles = useMemo(() => parseBundles(bundleTiers), [bundleTiers]);
  const commissionRate = parseFloat(commissionPercent) || 0;

  const breakdown = useMemo(
    () =>
      parsedBundles.map((bundle) => {
        const commission = Math.round(bundle.price * (commissionRate / 100) * 100) / 100;
        const driver = Math.round((bundle.price - commission) * 100) / 100;
        return { ...bundle, commission, driver };
      }),
    [parsedBundles, commissionRate]
  );

  const selectedPreview = breakdown.find(
    (row) => row.litres === parseFloat(previewLitres)
  );

  const updateBundle = (index: number, field: keyof BundleTier, value: string) => {
    setBundleTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    );
  };

  const addBundle = () => setBundleTiers((prev) => [...prev, emptyBundle()]);
  const removeBundle = (index: number) => {
    setBundleTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    setMessage("");
    try {
      await seedDefaults({});
      setBundleTiers(DEFAULT_BUNDLES);
      setCommissionPercent("5");
      setSettlementDays("3");
      setPreviewLitres("2500");
      setMessageType("success");
      setMessage("Standard bundles activated.");
    } catch (err) {
      setMessageType("error");
      setMessage(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setSeeding(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const parsed = parseBundles(bundleTiers);
      if (parsed.length === 0) throw new Error("Add at least one bundle");

      await updateConfig({
        bundleTiers: parsed,
        platformCommissionPercent: parseFloat(commissionPercent),
        settlementCycleDays: parseInt(settlementDays, 10),
      });
      setMessageType("success");
      setMessage("Pricing saved successfully.");
    } catch (err) {
      setMessageType("error");
      setMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated && config === undefined) {
    return <PageLoading title="Loading pricing" />;
  }

  const needsSetup = config?.isDefault || (config as { needsMigration?: boolean } | undefined)?.needsMigration;
  const lastUpdated = config?.updatedAt ? new Date(config.updatedAt).toLocaleString() : null;

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Bundle pricing</h2>
          <p className="subtitle">
            Customers pay the bundle price in cash. Platform earns {commissionPercent}% · drivers
            pay commission within {settlementDays} days.
          </p>
        </div>
        {lastUpdated && (
          <div className="page-meta">
            Last saved
            <div>{lastUpdated}</div>
          </div>
        )}
      </header>

      {needsSetup && (
        <div className="alert alert-warning">
          <div>
            <strong>Pricing not activated</strong>
            <p>Activate standard bundles (2,500L $35 · 5,000L $45 · 7,500L $65) or edit and save.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={handleSeedDefaults} disabled={seeding}>
            {seeding ? "Activating…" : "Activate bundles"}
          </button>
        </div>
      )}

      <div className="grid-2">
        <form className="card" onSubmit={handleSave}>
          <h3>Water bundles</h3>
          <p className="card-desc">Only these exact litre amounts can be ordered.</p>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Litres</th>
                  <th>Price (USD)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {bundleTiers.map((tier, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="2500"
                        value={tier.litres}
                        onChange={(e) => updateBundle(index, "litres", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="35"
                        value={tier.price}
                        onChange={(e) => updateBundle(index, "price", e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => removeBundle(index)}
                        disabled={bundleTiers.length <= 1}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-secondary" type="button" onClick={addBundle} style={{ marginBottom: 20 }}>
            + Add bundle
          </button>

          <div className="form-row-2">
            <label className="label">
              <span className="label-text">Platform commission %</span>
              <input
                className="input"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                required
              />
            </label>
            <label className="label">
              <span className="label-text">Commission due (days)</span>
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                value={settlementDays}
                onChange={(e) => setSettlementDays(e.target.value)}
                required
              />
            </label>
          </div>

          {message && (
            <p className={`message message-${messageType}`}>{message}</p>
          )}

          <div className="btn-row">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save pricing"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={handleSeedDefaults} disabled={seeding}>
              Reset to defaults
            </button>
          </div>
        </form>

        <div className="stack">
          <div className="card">
            <h3>Live breakdown</h3>
            <p className="card-desc">Split per bundle between platform and driver.</p>
            {breakdown.length === 0 ? (
              <p className="muted">Add bundles to see breakdown.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Bundle</th>
                      <th>Customer</th>
                      <th>Platform</th>
                      <th>Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((row) => (
                      <tr key={row.litres}>
                        <td>{formatLitres(row.litres)}L</td>
                        <td>${row.price.toFixed(2)}</td>
                        <td>${row.commission.toFixed(2)}</td>
                        <td>${row.driver.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Order preview</h3>
            <label className="label">
              <span className="label-text">Select bundle</span>
              <select
                className="input"
                value={previewLitres}
                onChange={(e) => setPreviewLitres(e.target.value)}
              >
                {parsedBundles.map((tier) => (
                  <option key={tier.litres} value={tier.litres}>
                    {formatLitres(tier.litres)}L — ${tier.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </label>
            {selectedPreview ? (
              <dl className="preview-list">
                <div className="preview-row highlight">
                  <dt>Customer pays</dt>
                  <dd>USD {selectedPreview.price.toFixed(2)}</dd>
                </div>
                <div className="preview-row">
                  <dt className="muted">Platform ({commissionRate}%)</dt>
                  <dd>USD {selectedPreview.commission.toFixed(2)}</dd>
                </div>
                <div className="preview-row">
                  <dt className="muted">Driver keeps</dt>
                  <dd>USD {selectedPreview.driver.toFixed(2)}</dd>
                </div>
              </dl>
            ) : (
              <p className="muted">Select a valid bundle.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
