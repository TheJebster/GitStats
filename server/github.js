const API_BASE = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 15_000;

function apiBase() {
  return (process.env.GITHUB_API_BASE || API_BASE).replace(/\/+$/, '');
}

/** Most recent rate-limit headers, grouped by GitHub resource (core/search). */
const lastRateLimits = {};

export class GithubError extends Error {
  constructor(message, { status = 502, code = 'GITHUB_ERROR', rateLimit = null, upstreamStatus = null } = {}) {
    super(message);
    this.name = 'GithubError';
    this.status = status;
    this.code = code;
    this.rateLimit = rateLimit;
    this.upstreamStatus = upstreamStatus;
  }
}

export function hasToken() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim());
}

export function getRateLimits() {
  return { ...lastRateLimits };
}

function readRateLimit(headers) {
  const limit = Number(headers.get('x-ratelimit-limit'));
  const remaining = Number(headers.get('x-ratelimit-remaining'));
  const reset = Number(headers.get('x-ratelimit-reset'));

  if (!Number.isFinite(limit) || !Number.isFinite(remaining) || !Number.isFinite(reset)) {
    return null;
  }

  return {
    resource: headers.get('x-ratelimit-resource') || 'core',
    limit,
    remaining,
    resetAt: new Date(reset * 1000).toISOString()
  };
}

function normalizeOverviewResource(resource) {
  if (!resource) return null;
  return {
    limit: resource.limit,
    remaining: resource.remaining,
    resetAt: new Date(resource.reset * 1000).toISOString()
  };
}

/**
 * Fetch a GitHub REST endpoint and turn failures into readable errors for the
 * browser. The token (if any) is only ever read here, on the server.
 */
export async function githubFetch(path, params = {}) {
  const url = new URL(`${apiBase()}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'GitStats'
  };

  if (hasToken()) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, { headers, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new GithubError('GitHub took too long to respond. Try again in a moment.', {
        status: 504,
        code: 'GITHUB_TIMEOUT'
      });
    }
    throw new GithubError('Could not reach GitHub. Check the server network connection.', {
      status: 502,
      code: 'NETWORK_ERROR'
    });
  } finally {
    clearTimeout(timeout);
  }

  const rateLimit = readRateLimit(response.headers);
  if (rateLimit) {
    lastRateLimits[rateLimit.resource] = rateLimit;
  }

  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const apiMessage = body?.message || `GitHub request failed with status ${response.status}`;

    if (response.status === 404) {
      throw new GithubError('Repository not found. Check the owner and repository name.', {
        status: 404,
        code: 'NOT_FOUND',
        rateLimit,
        upstreamStatus: response.status
      });
    }

    if (response.status === 403 || response.status === 429) {
      const isSearchLimit = rateLimit?.resource === 'search';
      throw new GithubError(
        isSearchLimit
          ? 'GitHub search rate limit reached. Wait a minute and try again.'
          : 'GitHub API rate limit reached. Add a GITHUB_TOKEN to .env for a much higher limit, or wait for the quota to reset.',
        { status: 429, code: 'RATE_LIMITED', rateLimit, upstreamStatus: response.status }
      );
    }

    if (response.status === 401) {
      throw new GithubError('GitHub rejected the configured token. Check GITHUB_TOKEN in .env.', {
        status: 502,
        code: 'GITHUB_AUTH',
        rateLimit,
        upstreamStatus: response.status
      });
    }

    throw new GithubError(apiMessage, {
      status: 502,
      code: 'GITHUB_ERROR',
      rateLimit,
      upstreamStatus: response.status
    });
  }

  return body;
}

export function getRepo(owner, repo) {
  return githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
}

export async function getCommits(owner, repo, since) {
  try {
    const commits = await githubFetch(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`,
      { since, per_page: 100 }
    );
    return Array.isArray(commits) ? commits : [];
  } catch (error) {
    // GitHub returns 409 for repositories without any commits.
    if (error.upstreamStatus === 409) return [];
    throw error;
  }
}

export function getClosedPulls(owner, repo) {
  return githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`, {
    state: 'closed',
    sort: 'updated',
    direction: 'desc',
    per_page: 100
  });
}

export function getLanguages(owner, repo) {
  return githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`);
}

export function searchIssues(query, { perPage = 100, sort = 'updated' } = {}) {
  return githubFetch('/search/issues', {
    q: query,
    sort,
    order: 'desc',
    per_page: perPage
  });
}

export function searchRepositories(query, { perPage = 12 } = {}) {
  return githubFetch('/search/repositories', {
    q: query,
    sort: 'stars',
    order: 'desc',
    per_page: perPage
  });
}

/** Returns both core and search quotas. /rate_limit does not consume quota. */
export async function getRateLimitOverview() {
  const data = await githubFetch('/rate_limit');
  const current = getRateLimits();

  return {
    core: normalizeOverviewResource(data?.resources?.core) || current.core || null,
    search: normalizeOverviewResource(data?.resources?.search) || current.search || null
  };
}
