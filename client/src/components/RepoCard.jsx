import { Link } from 'react-router-dom';
import { formatNumber, languageColor } from '../format.js';
import { StarIcon, ForkIcon, ArrowRightIcon } from './Icons.jsx';

export default function RepoCard({ repo }) {
  return (
    <Link className="repo-card" to={`/repo/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`}>
      <div className="repo-card-head">
        <img
          className="repo-card-avatar"
          src={repo.avatarUrl}
          alt=""
          width="40"
          height="40"
          loading="lazy"
        />
        <div className="repo-card-title">
          <span className="repo-owner">{repo.owner} /</span>
          <strong className="repo-name">{repo.name}</strong>
        </div>
      </div>

      <p className="repo-desc">{repo.description || 'No description provided.'}</p>

      <div className="repo-meta">
        {repo.language && (
          <span className="meta-item">
            <span className="lang-dot" style={{ background: languageColor(repo.language) }} />
            {repo.language}
          </span>
        )}
        <span className="meta-item">
          <StarIcon width={14} height={14} />
          {formatNumber(repo.stars)}
        </span>
        <span className="meta-item">
          <ForkIcon width={14} height={14} />
          {formatNumber(repo.forks)}
        </span>
      </div>

      <span className="repo-cta">
        View health <ArrowRightIcon width={14} height={14} />
      </span>
    </Link>
  );
}
