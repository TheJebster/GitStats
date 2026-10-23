/**
 * Accepts "facebook/react", "https://github.com/facebook/react",
 * "github.com/facebook/react/tree/main", or "git@github.com:facebook/react.git".
 */
export function parseRepoInput(raw) {
  if (typeof raw !== 'string') return null;

  let value = raw.trim();
  if (!value) return null;

  value = value
    .replace(/^git@github\.com:/i, '')
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^github\.com\//i, '')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.git$/i, '');

  const parts = value.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const [owner, repo] = parts;

  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(owner)) return null;
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(repo) || repo === '.' || repo === '..') return null;

  return { owner, repo };
}
