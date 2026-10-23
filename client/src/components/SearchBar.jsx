import { useState } from 'react';
import { parseRepoInput } from '../parseRepo.js';
import { SearchIcon, CloseIcon } from './Icons.jsx';

export default function SearchBar({ onSearch, recent = [], onRemoveRecent }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const parsed = parseRepoInput(value);

    if (!parsed) {
      setError('Use owner/repository, like facebook/react, or paste a GitHub URL.');
      return;
    }

    setError('');
    onSearch(parsed);
  }

  function handleRecent(label) {
    const parsed = parseRepoInput(label);
    if (parsed) onSearch(parsed);
  }

  return (
    <div className="search-wrap">
      <form className={`search-form${error ? ' has-error' : ''}`} onSubmit={handleSubmit} noValidate>
        <SearchIcon className="search-icon" width={20} height={20} />
        <input
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError('');
          }}
          placeholder="facebook/react"
          aria-label="GitHub repository"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'search-error' : undefined}
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit">Check health</button>
      </form>

      {error && (
        <p className="form-error" id="search-error" role="alert">
          {error}
        </p>
      )}

      {recent.length > 0 && (
        <div className="recent" aria-label="Recent searches">
          <span className="recent-label">Recent</span>
          {recent.map((label) => (
            <span className="recent-chip" key={label}>
              <button type="button" className="recent-chip-main" onClick={() => handleRecent(label)}>
                {label}
              </button>
              <button
                type="button"
                className="recent-chip-x"
                aria-label={`Remove ${label} from recent searches`}
                onClick={() => onRemoveRecent(label)}
              >
                <CloseIcon width={12} height={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
