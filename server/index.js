import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { GithubError, hasToken, getRateLimits, getRateLimitOverview } from './github.js';
import { getRepoStats, getTopRepos } from './stats.js';
import { withCache } from './cache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The .env file lives at the workspace root, not next to this file.
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

app.disable('x-powered-by');
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '10kb' }));

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function validateRepoParams(owner, repo) {
  if (!OWNER_PATTERN.test(owner) || !REPO_PATTERN.test(repo) || repo === '.' || repo === '..') {
    throw new GithubError('Invalid repository name. Use the form owner/repository.', {
      status: 400,
      code: 'INVALID_REPO'
    });
  }
}

app.get('/api/status', asyncHandler(async (req, res) => {
  let limits = {
    core: getRateLimits().core || null,
    search: getRateLimits().search || null
  };

  try {
    limits = await withCache('rate-limit-overview', 60_000, getRateLimitOverview);
  } catch {
    // GitHub may be unreachable. The last known headers are still useful.
  }

  res.json({
    tokenConfigured: hasToken(),
    rateLimit: limits.core,
    searchRateLimit: limits.search
  });
}));

app.get('/api/top-repos', asyncHandler(async (req, res) => {
  const sort = req.query.sort === 'rising' ? 'rising' : 'stars';
  const data = await getTopRepos(sort);
  res.json(data);
}));

app.get('/api/repos/:owner/:repo', asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  validateRepoParams(owner, repo);

  const data = await getRepoStats(owner, repo);
  res.json(data);
}));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.', code: 'API_NOT_FOUND' });
});

// Serve the built React app when it exists (npm run build && npm start).
const clientDist = path.resolve(__dirname, '../client/dist');

if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof GithubError) {
    return res.status(error.status).json({
      error: error.message,
      code: error.code,
      rateLimit: error.rateLimit || null
    });
  }

  console.error('[gitstats]', error);
  return res.status(500).json({
    error: 'Something went wrong on the server.',
    code: 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`GitStats API listening on http://localhost:${PORT}`);
  console.log(hasToken() ? 'GitHub token: configured' : 'GitHub token: not set (60 requests/hour)');
});
