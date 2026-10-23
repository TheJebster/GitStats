function formatPoints(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(1);
}

export default function BreakdownBars({ items }) {
  return (
    <ul className="breakdown">
      {items.map((item) => {
        const percent = Math.max(0, Math.min(100, (item.points / item.max) * 100));

        return (
          <li className="breakdown-item" key={item.key}>
            <div className="breakdown-head">
              <span className="breakdown-label">{item.label}</span>
              <span className="breakdown-points">
                {formatPoints(item.points)} <span>/ {item.max}</span>
              </span>
            </div>
            <div
              className="meter"
              role="progressbar"
              aria-label={item.label}
              aria-valuemin={0}
              aria-valuemax={item.max}
              aria-valuenow={item.points}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
            <p className="breakdown-detail">{item.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}
