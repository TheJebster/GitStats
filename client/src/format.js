const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1
});

const fullFormatter = new Intl.NumberFormat('en');

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value) >= 1000 ? compactFormatter.format(value) : fullFormatter.format(value);
}

export function formatPercent(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(digits)}%`;
}

export function formatDuration(days) {
  if (days === null || days === undefined || Number.isNaN(Number(days))) return '—';
  if (days < 1) return '< 1 day';
  if (days < 30) {
    const rounded = Math.round(days);
    return `${rounded} ${rounded === 1 ? 'day' : 'days'}`;
  }
  const months = days / 30.44;
  if (months < 12) return `${months.toFixed(1)} months`;
  return `${(days / 365.25).toFixed(1)} years`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(iso));
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export function timeAgo(iso) {
  if (!iso) return 'unknown';

  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60]
  ];

  for (const [unit, unitSeconds] of units) {
    if (Math.abs(seconds) >= unitSeconds) {
      return relative.format(-Math.round(seconds / unitSeconds), unit);
    }
  }

  return 'just now';
}

const LANGUAGE_TONES = [
  '#eeeeee', // bone
  '#b8b3b0', // pale stone
  '#8a8380', // warm granite
  '#4d4947', // graphite
  '#3d3a39', // ash
  '#1d1a18' // carbon
];

/**
 * Neutral ramp for language data — the Factory palette keeps chromatic
 * color for status, so code composition is rendered as a grayscale stack.
 */
export function languageTone(index = 0) {
  return LANGUAGE_TONES[Math.max(0, index) % LANGUAGE_TONES.length];
}
