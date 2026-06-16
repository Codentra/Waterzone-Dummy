"use client";

export default function PaymentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
      <p className="muted">{error.message}</p>
      <p style={{ fontSize: 14 }}>
        If this mentions a missing Convex function, start the backend from the{" "}
        <code>backend</code> folder with <code>dev.cmd</code> or{" "}
        <code>npm run dev</code>, then refresh.
      </p>
      <button className="btn btn-primary" type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
