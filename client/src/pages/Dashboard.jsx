import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRepoStats } from '../api.js';
import RepoHeader from '../components/RepoHeader.jsx';
import HealthGauge from '../components/HealthGauge.jsx';
import BreakdownBars from '../components/BreakdownBars.jsx';
import CommitChart from '../components/CommitChart.jsx';
import IssueDonut from '../components/IssueDonut.jsx';
import PullRequestPanel from '../components/PullRequestPanel.jsx';
import LanguageBar from '../components/LanguageBar.jsx';
import StatCard from '../components/StatCard.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { DashboardSkeleton } from '../components/Skeleton.jsx';
import {
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent
} from '../format.js';
import {
  ClockIcon,
  ForkIcon,
  IssueIcon,
  PullRequestIcon,
  StarIcon,
  WatchIcon
} from '../components/Icons.jsx';

function errorTitle(error) {
  if (!error) return 'Could not load this repository';
  if (error.code === 'NOT_FOUND') return 'Repository not found';
  if (error.code === 'RATE_LIMITED') return 'GitHub rate limit reached';
  if (error.code === 'INVALID_REPO') return 'That repository name looks invalid';
  return 'Could not load this repository';
}

export default function Dashboard() {
  const { owner, repo } = useParams();
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    setError(null);

    getRepoStats(owner, repo)
      .then((response) => {
        if (cancelled) return;
        setData(response);
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
  }, [owner, repo, attempt]);

  if (status === 'loading') {
    return <DashboardSkeleton />;
  }

  if (status === 'error') {
    const canRetry = ['RATE_LIMITED', 'NETWORK_ERROR', 'GITHUB_TIMEOUT', 'GITHUB_ERROR'].includes(error?.code);

    return (
      <div className="dashboard narrow">
        <Link to="/" className="back-link">← Back to search</Link>
        <ErrorState
          title={errorTitle(error)}
          error={error}
          onRetry={canRetry ? () => setAttempt((value) => value + 1) : undefined}
        />
      </div>
    );
  }

  const { repo: info, health, activity, issues, pullRequests, languages, generatedAt } = data;
  const mergeRate = pullRequests.mergeRate;
  const hasPulls = pullRequests.closed > 0;

  return (
    <div className="dashboard">
      <Link to="/" className="back-link">← Search another repository</Link>

      <RepoHeader repo={info} />

      <section className="panel health-panel">
        <HealthGauge score={health.score} grade={health.grade} tone={health.tone} />

        <div className="health-detail">
          <div className="health-heading">
            <div>
              <p className="panel-kicker">Health breakdown</p>
              <h2>Where the score comes from</h2>
            </div>
            <span className={`grade-badge tone-${health.tone}`}>{health.grade}</span>
          </div>

          <BreakdownBars items={health.breakdown} />
        </div>
      </section>

      <section className="stats-grid" aria-label="Key repository numbers">
        <StatCard
          label="Stars"
          value={formatNumber(info.stars)}
          sub="Stargazers"
          icon={<StarIcon />}
        />
        <StatCard
          label="Forks"
          value={formatNumber(info.forks)}
          sub="Public copies"
          icon={<ForkIcon />}
        />
        <StatCard
          label="Watchers"
          value={formatNumber(info.watchers)}
          sub="Subscribers"
          icon={<WatchIcon />}
        />
        <StatCard
          label="Open issues"
          value={formatNumber(issues.open)}
          sub={issues.closedPercent === null ? 'No issue data' : `${formatPercent(issues.closedPercent, 1)} of all issues closed`}
          icon={<IssueIcon />}
        />
        <StatCard
          label="Merge rate"
          value={hasPulls ? formatPercent(mergeRate) : '—'}
          sub={hasPulls ? `${pullRequests.merged} of ${pullRequests.closed} recent PRs` : 'No recent closed PRs'}
          icon={<PullRequestIcon />}
        />
        <StatCard
          label="Median close"
          value={formatDuration(issues.medianCloseDays)}
          sub={issues.sampled ? `${issues.sampled} issues sampled` : 'No recent closed issues'}
          icon={<ClockIcon />}
        />
      </section>

      <div className="charts-grid">
        <CommitChart activity={activity} />
        <IssueDonut issues={issues} />
      </div>

      <div className="details-grid">
        <PullRequestPanel pullRequests={pullRequests} />
        <LanguageBar languages={languages} />
      </div>

      <p className="data-note">
        Live GitHub data from {formatDateTime(generatedAt)}. Cached on the server for 10 minutes.
      </p>
    </div>
  );
}
