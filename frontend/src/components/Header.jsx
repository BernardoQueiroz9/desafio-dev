import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    gap: '16px',
    position: 'relative',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#333',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.5px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  logoAccent: {
    color: 'var(--ml-blue)',
  },
  searchGroup: {
    flex: '1 1 auto',
    display: 'flex',
    maxWidth: '640px',
    minWidth: '160px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    padding: '9px 14px',
    fontSize: '14px',
    outline: 'none',
    color: '#333',
    background: '#fff',
    minWidth: 0,
  },
  searchBtn: {
    background: 'var(--ml-blue)',
    border: 'none',
    padding: '0 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
    flexShrink: 0,
  },
  searchCloseBtn: {
    background: 'transparent',
    border: 'none',
    padding: '0 10px',
    cursor: 'pointer',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  navBtn: {
    background: 'transparent',
    border: 'none',
    color: '#333',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
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
    flexShrink: 0,
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
    flexShrink: 0,
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    color: '#333',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    padding: '6px 10px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  mobileSearchBtn: {
    background: 'var(--ml-blue)',
    border: 'none',
    cursor: 'pointer',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
    transition: 'background 0.15s',
  },
};

export default function Header({ onSearch, searchValue, onLogout, userName, onSync, syncing, hasDivergences, currentView }) {
  const navigate = useNavigate();
  const [localValue, setLocalValue] = useState(searchValue || '');
  const [hoverLogout, setHoverLogout] = useState(false);
  const [hoverSync, setHoverSync] = useState(false);
  const [hoverNav, setHoverNav] = useState({});
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(localValue);
    setMobileSearchOpen(false);
  };

  const handleClear = () => {
    setLocalValue('');
    if (onSearch) onSearch('');
  };

  const showNavExtra = currentView === 'grid' || currentView === 'product-detail';
  const showSync = showNavExtra;

  const handleNavClick = () => {
    if (showNavExtra) {
      navigate('/dashboard/meus-anuncios');
    } else {
      navigate(-1);
    }
  };

  return (
    <header style={styles.header} className={mobileSearchOpen ? 'header-search-active' : ''}>
      <div style={styles.inner} className="header-inner">

        <button onClick={() => navigate('/dashboard')} style={styles.logo} title="Ver anúncios">
          Desafio<span style={styles.logoAccent}>ML</span>
        </button>

        <div className="header-mobile-search-toggle">
          <button
            onClick={() => setMobileSearchOpen(true)}
            style={styles.mobileSearchBtn}
            aria-label="Abrir busca"
            title="Buscar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>

        <div className={`header-search-wrap${showNavExtra ? '' : ' header-search-nogrid'}${mobileSearchOpen ? ' header-search-expanded' : ''}`}
          style={{
            ...styles.searchGroup,
          }}
        >
          <input
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Buscar produtos..."
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            aria-label="Buscar produtos"
          />
          <button type="submit" onClick={handleSubmit} style={styles.searchBtn} aria-label="Buscar"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ml-blue-dark)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ml-blue)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <button type="button" className="header-search-close"
            onClick={() => setMobileSearchOpen(false)}
            style={styles.searchCloseBtn}
            aria-label="Fechar busca"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {showNavExtra && localValue && (
          <button onClick={handleClear} style={{ ...styles.logoutBtn, fontSize: '12px', color: 'var(--ml-text-tertiary)', padding: '6px 8px', flexShrink: 0 }}>
            Limpar
          </button>
        )}

        <div className="header-right-group" style={styles.rightGroup}>
          <button
            onClick={handleNavClick}
            style={{
              ...styles.navBtn,
              background: hoverNav.main ? 'rgba(0,0,0,0.06)' : 'transparent',
            }}
            onMouseEnter={() => setHoverNav(p => ({ ...p, main: true }))}
            onMouseLeave={() => setHoverNav(p => ({ ...p, main: false }))}
            title={showNavExtra ? 'Meus Anúncios' : 'Voltar'}
          >
            <span className="header-nav-text">{showNavExtra ? 'Meus Anúncios' : '← Voltar'}</span>
            <span className="header-nav-icon">
              {showNavExtra ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
              )}
            </span>
          </button>

          {showSync && onSync && (
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

          <span style={styles.userName} className="header-username">{userName}</span>

          <button
            onClick={onLogout}
            style={{
              ...styles.logoutBtn,
              background: hoverLogout ? 'rgba(0,0,0,0.06)' : 'transparent',
            }}
            onMouseEnter={() => setHoverLogout(true)}
            onMouseLeave={() => setHoverLogout(false)}
            aria-label="Sair"
            title="Sair"
          >
            <span className="header-nav-text">Sair</span>
            <span className="header-nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
