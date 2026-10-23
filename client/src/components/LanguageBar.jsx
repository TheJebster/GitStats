import { languageColor } from '../format.js';

export default function LanguageBar({ languages }) {
  const list = languages || [];

  return (
    <section className="panel">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Codebase</p>
          <h3>Languages</h3>
        </div>
        {list.length > 0 && <span className="chip">{list.length} shown</span>}
      </header>

      {list.length === 0 ? (
        <p className="chart-empty">No language data available.</p>
      ) : (
        <>
          <div
            className="language-bar"
            role="img"
            aria-label={`Language breakdown: ${list.map((language) => `${language.name} ${language.percent}%`).join(', ')}`}
          >
            {list.map((language) => (
              <span
                key={language.name}
                style={{
                  width: `${language.percent}%`,
                  background: languageColor(language.name)
                }}
              />
            ))}
          </div>

          <ul className="language-list">
            {list.map((language) => (
              <li key={language.name}>
                <span className="lang-dot" style={{ background: languageColor(language.name) }} />
                <span className="language-name">{language.name}</span>
                <strong>{language.percent}%</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
