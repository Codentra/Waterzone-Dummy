export function PageLoading({ title = "Loading" }: { title?: string }) {
  return (
    <div className="loading-page">
      <div className="page-header">
        <div>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
        </div>
      </div>
      <div className="skeleton-grid" style={{ marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
      <p className="muted" style={{ fontSize: "0.875rem" }}>
        {title}…
      </p>
    </div>
  );
}
