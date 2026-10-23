import { formatDateTime } from '../format.js';

export default function ErrorState({ title, error, onRetry }) {
  const resetAt = error?.rateLimit?.resetAt;

  return (
    <div className="error-state" role="alert">
      <span className="error-icon">!</span>
      <h3>{title}</h3>
      <p>{error?.message || 'Something went wrong.'}</p>
      {resetAt && <p className="error-meta">Your quota resets {formatDateTime(resetAt)}.</p>}
      {onRetry && (
        <button className="button" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
