const WIDTH = 640;
const HEIGHT = 240;
const MARGIN = { top: 18, right: 12, bottom: 32, left: 38 };
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

function shortDate(iso) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${iso}T00:00:00Z`));
}

export default function CommitChart({ activity }) {
  const days = activity?.days || [];
  const total = activity?.total ?? 0;
  const activeDays = activity?.activeDays ?? 0;
  const capped = activity?.capped ?? false;

  const max = Math.max(1, ...days.map((day) => day.count));
  const slot = INNER_WIDTH / Math.max(1, days.length);
  const barWidth = Math.max(4, slot * 0.58);
  const tickValues = [...new Set([0, Math.ceil(max / 2), max])];

  return (
    <section className="panel chart-panel">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Activity</p>
          <h3>Commit velocity</h3>
        </div>
        <span className="chip">{capped ? '100+' : total} commits · 30d</span>
      </header>

      {total === 0 ? (
        <div className="chart-empty">No commits on the default branch in the last 30 days.</div>
      ) : (
        <svg
          className="commit-chart"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Commit velocity over the last 30 days: ${total} commits across ${activeDays} active days.`}
        >
          {tickValues.map((tick) => {
            const y = MARGIN.top + INNER_HEIGHT - (tick / max) * INNER_HEIGHT;
            return (
              <g key={tick}>
                <line className="chart-grid-line" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y} y2={y} />
                <text className="chart-axis-text" x={MARGIN.left - 8} y={y} textAnchor="end" dominantBaseline="middle">
                  {tick}
                </text>
              </g>
            );
          })}

          {days.map((day, index) => {
            if (day.count === 0) return null;
            const barHeight = Math.max(3, (day.count / max) * INNER_HEIGHT);
            const x = MARGIN.left + index * slot + (slot - barWidth) / 2;
            const y = MARGIN.top + INNER_HEIGHT - barHeight;

            return (
              <rect
                className="chart-bar"
                key={day.date}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="3"
              >
                <title>{`${shortDate(day.date)}: ${day.count} ${day.count === 1 ? 'commit' : 'commits'}`}</title>
              </rect>
            );
          })}

          <line
            className="chart-baseline"
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={MARGIN.top + INNER_HEIGHT}
            y2={MARGIN.top + INNER_HEIGHT}
          />

          {days.map((day, index) =>
            index % 5 === 0 ? (
              <text
                className="chart-axis-text"
                key={`label-${day.date}`}
                x={MARGIN.left + index * slot + slot / 2}
                y={HEIGHT - 10}
                textAnchor="middle"
              >
                {shortDate(day.date)}
              </text>
            ) : null
          )}
        </svg>
      )}

      <p className="panel-note">
        {activeDays} active {activeDays === 1 ? 'day' : 'days'} in the last 30.
        {capped ? ' Showing the latest 100 commits.' : ''}
      </p>
    </section>
  );
}
