import { formatDuration } from '../format.js';

export default function PullRequestPanel({ pullRequests }) {
  const { merged = 0, closed = 0, mergeRate, medianMergeDays, capped = false } = pullRequests || {};
  const hasData = closed > 0;

  return (
    <section className="panel">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Review flow</p>
          <h3>Pull requests</h3>
        </div>
        <span className="chip">{hasData ? `${merged}/${closed} merged` : 'No recent PRs'}</span>
      </header>

      {hasData ? (
        <>
          <div className="big-stats">
            <div className="big-stat-block">
              <span className="big-stat">{mergeRate === null ? '—' : `${Math.round(mergeRate)}%`}</span>
              <span className="big-stat-label">merge rate</span>
            </div>
            <div className="big-stat-block">
              <span className="big-stat">{formatDuration(medianMergeDays)}</span>
              <span className="big-stat-label">median time to merge</span>
            </div>
          </div>

          <div className="meter meter-large" role="progressbar" aria-label="Pull request merge rate" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(mergeRate || 0)}>
            <span style={{ width: `${Math.max(0, Math.min(100, mergeRate || 0))}%` }} />
          </div>

          <p className="panel-note">
            {merged} merged of {closed} recently closed pull requests{capped ? ' (latest 100 sampled)' : ''}.
          </p>
        </>
      ) : (
        <p className="chart-empty">No recently closed pull requests. This part of the score is neutral.</p>
      )}
    </section>
  );
}
