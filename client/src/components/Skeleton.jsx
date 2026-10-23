export function Skeleton({ className = '' }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}

export function RepoGridSkeleton({ count = 6 }) {
  return (
    <div className="repo-grid" aria-busy="true" aria-label="Loading repositories">
      {Array.from({ length: count }, (_, index) => (
        <div className="repo-card skeleton-card" key={index}>
          <div className="skeleton-row">
            <Skeleton className="sk-avatar-sm" />
            <div className="skeleton-stack">
              <Skeleton className="sk-line sk-w-40" />
              <Skeleton className="sk-line sk-w-60" />
            </div>
          </div>
          <Skeleton className="sk-line sk-w-full" />
          <Skeleton className="sk-line sk-w-80" />
          <div className="skeleton-row">
            <Skeleton className="sk-pill" />
            <Skeleton className="sk-pill" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard" aria-busy="true" aria-label="Loading repository health">
      <Skeleton className="sk-line sk-w-30 sk-back" />

      <section className="panel repo-header skeleton-panel">
        <Skeleton className="sk-avatar" />
        <div className="skeleton-stack">
          <Skeleton className="sk-line sk-w-50 sk-tall" />
          <Skeleton className="sk-line sk-w-80" />
          <Skeleton className="sk-line sk-w-40" />
        </div>
      </section>

      <section className="panel health-panel skeleton-panel">
        <Skeleton className="sk-gauge" />
        <div className="skeleton-stack skeleton-stack-wide">
          <Skeleton className="sk-line sk-w-40 sk-tall" />
          <Skeleton className="sk-line sk-w-full" />
          <Skeleton className="sk-line sk-w-full" />
          <Skeleton className="sk-line sk-w-full" />
        </div>
      </section>

      <div className="stats-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="stat-card skeleton-panel" key={index}>
            <Skeleton className="sk-line sk-w-40" />
            <Skeleton className="sk-line sk-w-60 sk-tall" />
            <Skeleton className="sk-line sk-w-80" />
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="panel skeleton-panel">
          <Skeleton className="sk-chart" />
        </div>
        <div className="panel skeleton-panel">
          <Skeleton className="sk-chart" />
        </div>
      </div>
    </div>
  );
}
