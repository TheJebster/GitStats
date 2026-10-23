const RADIUS = 82;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HealthGauge({ score, grade, tone }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const offset = CIRCUMFERENCE * (1 - safeScore / 100);

  return (
    <div
      className={`gauge tone-${tone}`}
      role="img"
      aria-label={`Repository health score ${safeScore} out of 100. ${grade}.`}
    >
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle className="gauge-track" cx="100" cy="100" r={RADIUS} />
        <circle
          className="gauge-value"
          cx="100"
          cy="100"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-label">
        <span className="gauge-score">{safeScore}</span>
        <span className="gauge-max">out of 100</span>
      </div>
    </div>
  );
}
