import {
  getRepo,
  getCommits,
  getClosedPulls,
  getLanguages,
  searchIssues,
  searchRepositories,
  getRateLimits
} from './github.js';
import { calculateHealth, median, DAY } from './health.js';
import { withCache } from './cache.js';

const REPO_TTL_MS = 10 * 60 * 1000;
const TOP_TTL_MS = 15 * 60 * 1000;
const TOP_REPO_LIMIT = 12;

function startOfUtcDay(timestamp) {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(later, earlier) {
  const value = (new Date(later).getTime() - new Date(earlier).getTime()) / DAY;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function buildCommitVelocity(commits, since) {
  const days = [];

  for (let index = 0; index < 30; index += 1) {
    days.push({
      date: dayKey(new Date(since.getTime() + index * DAY)),
      count: 0
    });
  }

  const byDate = new Map(days.map((day) => [day.date, day]));

  for (const commit of commits) {
    const iso =
      commit?.commit?.committer?.date ||
      commit?.commit?.author?.date ||
      null;

    if (!iso) continue;

    const day = byDate.get(iso.slice(0, 10));
    if (day) day.count += 1;
  }

  return {
    days,
    total: commits.length,
    activeDays: days.filter((day) => day.count > 0).length,
    capped: commits.length >= 100,
    since: since.toISOString()
  };
}

function buildIssues(openResponse, closedResponse) {
  const closedItems = Array.isArray(closedResponse?.items) ? closedResponse.items : [];
  const open = Number(openResponse?.total_count) || 0;
  const closed = Number(closedResponse?.total_count) || 0;
  const total = open + closed;

  const durations = closedItems
    .map((issue) => (issue.closed_at ? daysBetween(issue.closed_at, issue.created_at) : null))
    .filter((value) => value !== null);

  return {
    open,
    closed,
    total,
    closedPercent: total > 0 ? round((closed / total) * 100, 1) : null,
    medianCloseDays: durations.length ? round(median(durations), 2) : null,
    sampled: closedItems.length
  };
}

function buildPullRequests(pulls) {
  const closed = pulls.length;
  const mergedItems = pulls.filter((pull) => pull.merged_at);
  const merged = mergedItems.length;

  const mergeDurations = mergedItems
    .map((pull) => daysBetween(pull.merged_at, pull.created_at))
    .filter((value) => value !== null);

  return {
    merged,
    closed,
    mergeRate: closed > 0 ? round((merged / closed) * 100, 1) : null,
    medianMergeDays: mergeDurations.length ? round(median(mergeDurations), 2) : null,
    capped: closed >= 100
  };
}

function buildLanguages(languages) {
  const entries = Object.entries(languages || {})
    .filter(([, bytes]) => Number.isFinite(bytes) && bytes > 0)
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) return [];

  const totalBytes = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  const top = entries.slice(0, 5).map(([name, bytes]) => ({ name, bytes }));
  const otherBytes = entries.slice(5).reduce((sum, [, bytes]) => sum + bytes, 0);

  if (otherBytes > 0) {
    top.push({ name: 'Other', bytes: otherBytes });
  }

  return top.map(({ name, bytes }) => ({
    name,
    bytes,
    percent: round((bytes / totalBytes) * 100, 1)
  }));
}

function normalizeRepo(repo, fallbackOwner, fallbackName) {
  const license = repo?.license?.spdx_id;

  return {
    owner: repo?.owner?.login || fallbackOwner,
    name: repo?.name || fallbackName,
    fullName: repo?.full_name || `${fallbackOwner}/${fallbackName}`,
    description: repo?.description || '',
    avatarUrl: repo?.owner?.avatar_url || '',
    htmlUrl: repo?.html_url || `https://github.com/${fallbackOwner}/${fallbackName}`,
    homepage: /^https?:\/\//i.test(repo?.homepage || '') ? repo.homepage : '',
    stars: repo?.stargazers_count ?? 0,
    forks: repo?.forks_count ?? 0,
    watchers: repo?.subscribers_count ?? repo?.watchers_count ?? 0,
    language: repo?.language || null,
    topics: Array.isArray(repo?.topics) ? repo.topics.slice(0, 8) : [],
    license: license && license !== 'NOASSERTION' ? repo.license.name : null,
    createdAt: repo?.created_at || null,
    pushedAt: repo?.pushed_at || null,
    defaultBranch: repo?.default_branch || null,
    archived: Boolean(repo?.archived)
  };
}

export function getRepoStats(owner, repo) {
  const cacheKey = `repo:${owner}/${repo}`.toLowerCase();

  return withCache(cacheKey, REPO_TTL_MS, async () => {
    const since = startOfUtcDay(Date.now() - 29 * DAY);

    const [repoData, commits, pulls, languages, openIssues, closedIssues] = await Promise.all([
      getRepo(owner, repo),
      getCommits(owner, repo, since.toISOString()),
      getClosedPulls(owner, repo),
      getLanguages(owner, repo),
      searchIssues(`repo:${owner}/${repo} type:issue state:open`, { perPage: 1 }),
      searchIssues(`repo:${owner}/${repo} type:issue state:closed`, { perPage: 100 })
    ]);

    const commitList = Array.isArray(commits) ? commits : [];
    const pullList = Array.isArray(pulls) ? pulls : [];

    const activity = buildCommitVelocity(commitList, since);
    const issues = buildIssues(openIssues, closedIssues);
    const pullRequests = buildPullRequests(pullList);

    const health = calculateHealth({
      commits30d: activity.total,
      activeDays: activity.activeDays,
      medianCloseDays: issues.medianCloseDays,
      mergedPRs: pullRequests.merged,
      closedPRs: pullRequests.closed,
      issueSample: issues.sampled,
      prCapped: pullRequests.capped
    });

    return {
      repo: normalizeRepo(repoData, owner, repo),
      health,
      activity,
      issues,
      pullRequests,
      languages: buildLanguages(languages),
      rateLimit: getRateLimits().core || null,
      generatedAt: new Date().toISOString()
    };
  });
}

export function getTopRepos(sort = 'stars') {
  const mode = sort === 'rising' ? 'rising' : 'stars';

  return withCache(`top:${mode}`, TOP_TTL_MS, async () => {
    const since = dayKey(new Date(Date.now() - 90 * DAY));
    const query = mode === 'rising'
      ? `stars:>100 created:>=${since}`
      : 'stars:>50000';

    const data = await searchRepositories(query, { perPage: TOP_REPO_LIMIT });
    const items = Array.isArray(data?.items) ? data.items : [];

    const repos = items.map((item) => ({
      owner: item.owner?.login || 'unknown',
      name: item.name,
      fullName: item.full_name,
      description: item.description || '',
      avatarUrl: item.owner?.avatar_url || '',
      htmlUrl: item.html_url,
      stars: item.stargazers_count ?? 0,
      forks: item.forks_count ?? 0,
      language: item.language || null,
      topics: Array.isArray(item.topics) ? item.topics.slice(0, 4) : []
    }));

    return {
      sort: mode,
      repos,
      rateLimit: getRateLimits().search || null
    };
  });
}
