import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopRepos } from '../api.js';
import SearchBar from '../components/SearchBar.jsx';
import RepoCard from '../components/RepoCard.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { RepoGridSkeleton } from '../components/Skeleton.jsx';

const RECENT_KEY = 'gitstats:recent-repos';
const MAX_RECENT = 5;

function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === 'string').slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

function saveRecent(repos) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(repos));
  } catch {
    // Private browsing can block storage. Recent searches are a nice-to-have.
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [sort, setSort] = useState('stars');
  const [repos, setRepos] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState(readRecent);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    setError(null);

    getTopRepos(sort)
      .then((data) => {
        if (cancelled) return;
        setRepos(data.repos || []);
        setStatus('ready');
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [sort, attempt]);

  const handleSearch = useCallback(
    ({ owner, repo }) => {
      const label = `${owner}/${repo}`;

      setRecent((previous) => {
        const next = [
          label,
          ...previous.filter((item) => item.toLowerCase() !== label.toLowerCase())
        ].slice(0, MAX_RECENT);
        saveRecent(next);
        return next;
      });

      navigate(`/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    },
    [navigate]
  );

  const handleRemoveRecent = useCallback((label) => {
    setRecent((previous) => {
      const next = previous.filter((item) => item !== label);
      saveRecent(next);
      return next;
    });
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">
          <span className="pulse-dot" />
          Live open-source health checks
        </p>

        <h1>Is that repository actually healthy?</h1>

        <p className="hero-copy">
          Search any public GitHub repository. GitStats scores its commit rhythm, issue response
          time, and pull-request flow — then breaks the score down for you.
        </p>

        <SearchBar
          onSearch={handleSearch}
          recent={recent}
          onRemoveRecent={handleRemoveRecent}
        />
      </section>

      <section className="feature-strip" aria-label="What GitStats measures">
        <article className="feature">
          <span className="feature-index" aria-hidden="true">01</span>
          <div>
            <h2>Health score</h2>
            <p>A weighted 0–100 score from commits, issue speed, and PR merges.</p>
          </div>
        </article>
        <article className="feature">
          <span className="feature-index" aria-hidden="true">02</span>
          <div>
            <h2>30-day activity</h2>
            <p>Daily commit velocity plus active days, so bursts are not mistaken for momentum.</p>
          </div>
        </article>
        <article className="feature">
          <span className="feature-index" aria-hidden="true">03</span>
          <div>
            <h2>Issue balance</h2>
            <p>Open versus closed issues and the median time it takes to close one.</p>
          </div>
        </article>
      </section>

      <section className="top-section">
        <div className="section-heading">
          <div>
            <h2>Top repositories</h2>
            <p>
              {sort === 'stars'
                ? 'The most-starred projects on GitHub, live from the API.'
                : 'Projects created in the last 90 days that are gaining stars fast.'}
            </p>
          </div>

          <div className="tabs" aria-label="Repository ranking">
            <button
              type="button"
              aria-pressed={sort === 'stars'}
              className={sort === 'stars' ? 'is-active' : ''}
              onClick={() => setSort('stars')}
            >
              Most starred
            </button>
            <button
              type="button"
              aria-pressed={sort === 'rising'}
              className={sort === 'rising' ? 'is-active' : ''}
              onClick={() => setSort('rising')}
            >
              Rising
            </button>
          </div>
        </div>

        <div>
          {status === 'loading' && <RepoGridSkeleton count={6} />}

          {status === 'error' && (
            <ErrorState
              title="Could not load top repositories"
              error={error}
              onRetry={() => setAttempt((value) => value + 1)}
            />
          )}

          {status === 'ready' && repos.length === 0 && (
            <p className="empty-state">No repositories were returned.</p>
          )}

          {status === 'ready' && repos.length > 0 && (
            <div className="repo-grid">
              {repos.map((repo) => (
                <RepoCard key={repo.fullName} repo={repo} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
