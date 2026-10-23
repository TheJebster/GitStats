import { timeAgo } from '../format.js';
import { ExternalIcon } from './Icons.jsx';

export default function RepoHeader({ repo }) {
  return (
    <section className="repo-window">
      <div className="window-bar">
        <span className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="window-title">
          gitstats — {repo.owner}/{repo.name}
        </span>
        <span className="window-live" title="Live data from the GitHub API" />
      </div>

      <div className="panel repo-header">
        <img
          className="repo-page-avatar"
          src={repo.avatarUrl}
          alt=""
          width="64"
          height="64"
        />

        <div className="repo-header-body">
          <div className="repo-title-row">
            <h1>
              <span className="repo-owner">{repo.owner} /</span> {repo.name}
            </h1>
            {repo.archived && <span className="tag">Archived</span>}
          </div>

          <p className="repo-description">{repo.description || 'No description provided.'}</p>

          <div className="repo-facts">
            {repo.language && (
              <span className="fact">
                <span className="lang-dot" />
                {repo.language}
              </span>
            )}
            {repo.license && <span className="fact">{repo.license}</span>}
            <span className="fact">Last push {timeAgo(repo.pushedAt)}</span>
            {repo.homepage && (
              <a className="fact fact-link" href={repo.homepage} target="_blank" rel="noreferrer">
                Homepage <ExternalIcon width={12} height={12} />
              </a>
            )}
          </div>

          {repo.topics.length > 0 && (
            <div className="topics">
              {repo.topics.map((topic) => (
                <span className="topic" key={topic}>{topic}</span>
              ))}
            </div>
          )}
        </div>

        <a className="button button-ghost repo-header-link" href={repo.htmlUrl} target="_blank" rel="noreferrer">
          View on GitHub <ExternalIcon width={14} height={14} />
        </a>
      </div>
    </section>
  );
}
