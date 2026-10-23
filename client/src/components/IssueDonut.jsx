import { formatNumber } from '../format.js';

export default function IssueDonut({ issues }) {
  const total = (issues?.open ?? 0) + (issues?.closed ?? 0);
  const closedPercent = total > 0 ? ((issues.closed / total) * 100) : 0;
  const displayPercent = issues?.closedPercent;
  const gradient = total > 0
    ? `conic-gradient(var(--color-metric-green) 0 ${closedPercent}%, var(--color-graphite-mid) ${closedPercent}% 100%)`
    : undefined;

  return (
    <section className="panel chart-panel">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Triage</p>
          <h3>Issue balance</h3>
        </div>
        <span className="chip">{formatNumber(total)} total</span>
      </header>

      <div className="donut-wrap">
        <div
          className={`donut${total === 0 ? ' is-empty' : ''}`}
          style={gradient ? { background: gradient } : undefined}
          role="img"
          aria-label={total > 0 ? `${closedPercent.toFixed(1)} percent of issues are closed.` : 'No issues found.'}
        >
          <div className="donut-hole">
            <strong>{displayPercent === null || displayPercent === undefined ? '—' : `${Math.round(displayPercent)}%`}</strong>
            <span>closed</span>
          </div>
        </div>

        <ul className="legend">
          <li>
            <span className="legend-dot is-closed" />
            <span className="legend-label">Closed</span>
            <strong>{formatNumber(issues?.closed ?? 0)}</strong>
          </li>
          <li>
            <span className="legend-dot is-open" />
            <span className="legend-label">Open</span>
            <strong>{formatNumber(issues?.open ?? 0)}</strong>
          </li>
        </ul>
      </div>

      <p className="panel-note">
        {issues?.sampled
          ? `Close-time median sampled from ${issues.sampled} recently closed issues.`
          : 'No recently closed issues to sample.'}
      </p>
    </section>
  );
}
