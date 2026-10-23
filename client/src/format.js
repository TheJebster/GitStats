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

const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Dart: '#00B4AB',
  Haskell: '#5e5086',
  Lua: '#000080',
  Elixir: '#6e4a7e',
  'Jupyter Notebook': '#DA5B0B',
  Other: '#6e7681'
};

const FALLBACK_COLORS = ['#58a6ff', '#bc8cff', '#3fb950', '#d29922', '#f778ba', '#39c5cf'];

export function languageColor(language) {
  if (!language) return '#6e7681';
  if (LANGUAGE_COLORS[language]) return LANGUAGE_COLORS[language];

  let hash = 0;
  for (let index = 0; index < language.length; index += 1) {
    hash = language.charCodeAt(index) + ((hash << 5) - hash);
  }

  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}
