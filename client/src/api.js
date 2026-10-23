const BASE_URL = import.meta.env.VITE_API_URL || '';

function makeError(message, code, extra = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extra);
  return error;
}

async function request(path) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: 'application/json' }
    });
  } catch {
    throw makeError('Could not reach the GitStats server. Is it running?', 'NETWORK_ERROR');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw makeError(data.error || 'The request failed.', data.code || 'REQUEST_FAILED', {
      status: response.status,
      rateLimit: data.rateLimit || null
    });
  }

  return data;
}

export function getTopRepos(sort = 'stars') {
  return request(`/api/top-repos?sort=${encodeURIComponent(sort)}`);
}

export function getRepoStats(owner, repo) {
  return request(`/api/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
}
