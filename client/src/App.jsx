import { Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';

function Logo() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
      <rect width="32" height="32" rx="4" fill="#101010" stroke="#3d3a39" />
      <path d="M8 21V11M16 24V8M24 19v-6" stroke="#eeeeee" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 19v-6" stroke="#ee6018" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand" aria-label="GitStats home">
          <Logo />
          <span className="brand-name">
            Git<span className="brand-accent">Stats</span>
          </span>
        </Link>
      </div>
    </header>
  );
}

function NotFound() {
  return (
    <div className="dashboard narrow">
      <div className="error-state">
        <span className="error-icon">404</span>
        <h3>Page not found</h3>
        <p>The page you were looking for does not exist.</p>
        <Link className="button" to="/">Back to search</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header />

      <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/repo/:owner/:repo" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>GitStats — live repository health from the GitHub REST API.</span>
          <span className="footer-muted">Results are cached for 10 minutes on the server.</span>
        </div>
      </footer>
    </div>
  );
}
