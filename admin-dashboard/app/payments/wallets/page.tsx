"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

export default function WalletsPage() {
  const [role, setRole] = useState<"customer" | "driver" | "admin" | "">("");
  const accounts = useQuery(api.admin.wallets.listAccounts, {
    role: role || undefined,
  });

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Wallet accounts</h1>
      <div style={{ marginBottom: 16 }}>
        <select
          className="input"
          style={{ maxWidth: 200 }}
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
        >
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="driver">Driver</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {accounts === undefined ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.userId}>
                  <td>{a.fullName}</td>
                  <td>{a.phoneE164}</td>
                  <td>
                    <span className="badge">{a.role}</span>
                  </td>
                  <td>
                    {a.currency} {a.balance.toFixed(2)}
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
