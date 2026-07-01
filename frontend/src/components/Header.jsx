import { useState } from 'react';

const styles = {
  header: {
    background: 'var(--ml-yellow)',
    padding: '8px 0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#333',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.5px',
  },
  logoAccent: {
    color: 'var(--ml-blue)',
  },
  searchWrapper: {
    flex: 1,
    display: 'flex',
    maxWidth: '600px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    color: '#333',
    background: '#fff',
  },
  searchButton: {
    background: 'var(--ml-blue)',
    border: 'none',
    padding: '0 14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },
  syncBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    color: '#333',
    transition: 'background 0.15s',
    position: 'relative',
  },
  syncBadge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--ml-red)',
  },
  userName: {
    fontSize: '13px',
    color: '#555',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    color: '#333',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    padding: '6px 12px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  logoutBtnHover: {
    background: 'rgba(0,0,0,0.06)',
  },
};

export default function Header({ onSearch, searchValue, onLogout, userName, onSync, syncing, hasDivergences }) {
  const [localValue, setLocalValue] = useState(searchValue || '');
  const [hoverLogout, setHoverLogout] = useState(false);
  const [hoverSync, setHoverSync] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(localValue);
  };

  const handleClear = () => {
    setLocalValue('');
    if (onSearch) onSearch('');
  };

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <a href="/dashboard" style={styles.logo}>
          Desafio<span style={styles.logoAccent}>ML</span>
        </a>

        <form onSubmit={handleSubmit} style={styles.searchWrapper}>
          <input
            style={styles.searchInput}
            placeholder="Buscar produtos..."
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            aria-label="Buscar produtos"
          />
          <button type="submit" style={styles.searchButton} aria-label="Buscar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </form>

        {localValue && (
          <button
            onClick={handleClear}
            style={{ ...styles.logoutBtn, fontSize: '12px', color: 'var(--ml-text-tertiary)' }}
          >
            Limpar
          </button>
        )}

        {onSync && (
          <button
            style={{
              ...styles.syncBtn,
              background: hoverSync ? 'rgba(0,0,0,0.06)' : 'transparent',
              animation: syncing ? 'spin 1s linear infinite' : 'none',
            }}
            onClick={onSync}
            onMouseEnter={() => setHoverSync(true)}
            onMouseLeave={() => setHoverSync(false)}
            disabled={syncing}
            aria-label="Sincronizar com marketplace"
            title="Verificar divergências com o marketplace"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {hasDivergences && <span style={styles.syncBadge} />}
          </button>
        )}

        <span style={styles.userName}>{userName}</span>

        <button
          onClick={onLogout}
          style={{
            ...styles.logoutBtn,
            background: hoverLogout ? styles.logoutBtnHover.background : 'transparent',
          }}
          onMouseEnter={() => setHoverLogout(true)}
          onMouseLeave={() => setHoverLogout(false)}
        >
          Sair
        </button>
      </div>
    </header>
  );
}
