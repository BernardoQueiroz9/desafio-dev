import { useState, useRef, useEffect, useCallback } from 'react';

const colors = {
  blue: '#3483FA',
  blueDark: '#2968C8',
  blueLight: '#E7F0FF',
  text: '#333',
  textSec: '#666',
  textTer: '#999',
  border: '#E0E0E0',
  bgCard: '#FFF',
  bgBody: '#FAFAFA',
};

const fmt = (num) => {
  if (num == null || isNaN(num)) return 'R$ 0,00';
  return Number(num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

function parseBr(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

function RangeSlider({ value, onChange, rangeMin = 0, rangeMax = 10000 }) {
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(null);

  const clamp = (v) => Math.min(rangeMax, Math.max(rangeMin, v));

  const posToVal = useCallback((clientX) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(clamp(rangeMin + pct * (rangeMax - rangeMin)));
  }, [rangeMin, rangeMax, clamp]);

  const handleMouseDown = (thumb) => (e) => {
    e.preventDefault();
    setDrag(thumb);
  };

  useEffect(() => {
    if (!drag) return;
    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const val = posToVal(clientX);
      if (drag === 'min') {
        onChange({ ...value, min: Math.min(val, value.max) });
      } else {
        onChange({ ...value, max: Math.max(val, value.min) });
      }
    };
    const handleUp = () => setDrag(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [drag, posToVal, value, onChange]);

  const pctMin = ((value.min - rangeMin) / (rangeMax - rangeMin)) * 100;
  const pctMax = ((value.max - rangeMin) / (rangeMax - rangeMin)) * 100;

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.textTer, marginBottom: '6px' }}>
        <span>{fmt(value.min)}</span>
        <span>{fmt(value.max)}</span>
      </div>
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          height: '6px',
          background: '#E0E0E0',
          borderRadius: '3px',
          cursor: 'pointer',
        }}
        onMouseDown={(e) => {
          const val = posToVal(e.clientX);
          const mid = (value.min + value.max) / 2;
          if (val < mid) {
            onChange({ ...value, min: Math.min(val, value.max) });
          } else {
            onChange({ ...value, max: Math.max(val, value.min) });
          }
        }}
        onTouchStart={(e) => {
          if (e.touches.length !== 1) return;
          const val = posToVal(e.touches[0].clientX);
          const mid = (value.min + value.max) / 2;
          if (val < mid) {
            onChange({ ...value, min: Math.min(val, value.max) });
          } else {
            onChange({ ...value, max: Math.max(val, value.min) });
          }
        }}
      >
        <div style={{
          position: 'absolute',
          left: `${pctMin}%`,
          width: `${pctMax - pctMin}%`,
          height: '100%',
          background: colors.blue,
          borderRadius: '3px',
        }} />
        <div
          onMouseDown={handleMouseDown('min')}
          onTouchStart={(e) => { e.preventDefault(); setDrag('min'); }}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${Math.max(0, Math.min(100, pctMin))}%`,
            width: '18px',
            height: '18px',
            background: '#FFF',
            border: `2px solid ${colors.blue}`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'grab',
            touchAction: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            zIndex: drag === 'min' ? 2 : 1,
          }}
        />
        <div
          onMouseDown={handleMouseDown('max')}
          onTouchStart={(e) => { e.preventDefault(); setDrag('max'); }}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${Math.max(0, Math.min(100, pctMax))}%`,
            width: '18px',
            height: '18px',
            background: '#FFF',
            border: `2px solid ${colors.blue}`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'grab',
            touchAction: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            zIndex: drag === 'max' ? 2 : 1,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: colors.textTer, marginTop: '4px' }}>
        <span>R$ 0</span>
        <span>R$ {rangeMax.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
}

export default function Sidebar({ filters, setFilters, onFilter, collapsed, onToggleCollapse, currentView, onNavigate, onSync, syncing, hasDivergences, userName, onLogout }) {
  const rawMin = filters.minPrice || '';
  const rawMax = filters.maxPrice || '';
  const numMin = parseBr(rawMin);
  const numMax = parseBr(rawMax);

  const sliderMax = Math.max(10000, numMax, numMin + 1);
  const sliderMin = 0;

  const rangeVal = {
    min: Math.min(numMin, numMax || sliderMax),
    max: Math.max(numMin, numMax || sliderMax),
  };

  const handleRangeChange = (val) => {
    const minStr = val.min > 0 ? val.min.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
    const maxStr = val.max > 0 ? val.max.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
    setFilters({ minPrice: minStr, maxPrice: maxStr });
  };

  const handleInputChange = (field) => (e) => {
    const raw = e.target.value.replace(/[^\d,.]/g, '');
    const key = field === 'min' ? 'minPrice' : 'maxPrice';
    setFilters({ ...filters, [key]: raw });
  };

  const handleInputBlur = (field) => (e) => {
    e.target.style.borderColor = colors.border;
    const key = field === 'min' ? 'minPrice' : 'maxPrice';
    const num = parseBr(filters[key]);
    if (num > 0) {
      setFilters({ ...filters, [key]: num.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) });
    }
  };

  if (collapsed) {
    return (
      <aside style={{
        width: '40px', minWidth: '40px', background: colors.bgCard,
        borderRight: `1px solid ${colors.border}`, display: 'flex',
        flexDirection: 'column', alignItems: 'center', paddingTop: '8px',
      }}>
        <button onClick={onToggleCollapse} title="Abrir filtros"
          style={{
            width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${colors.border}`,
            background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: colors.textSec,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.target.style.background = colors.blueLight; e.target.style.borderColor = colors.blue; e.target.style.color = colors.blue; }}
          onMouseLeave={(e) => { e.target.style.background = '#FFF'; e.target.style.borderColor = colors.border; e.target.style.color = colors.textSec; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </aside>
    );
  }

  const sharedInput = {
    width: '100%', padding: '7px 8px', border: `1px solid ${colors.border}`, borderRadius: '4px',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#FFF', fontFamily: 'inherit',
  };

  return (
    <aside style={{
      width: '300px', minWidth: '300px', background: colors.bgCard,
      borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column',
      overflowY: 'auto', transition: 'width 0.2s',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 12px 8px',
      }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: colors.text }}>Filtros</span>
        <button onClick={onToggleCollapse} title="Fechar filtros"
          style={{
            width: '28px', height: '28px', borderRadius: '4px', border: 'none',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: colors.textTer,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.target.style.background = colors.border; e.target.style.color = colors.text; }}
          onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = colors.textTer; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '12px', background: colors.bgCard }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: colors.textSec, marginBottom: '10px' }}>Faixa de preço</p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: colors.textTer, display: 'block', marginBottom: '2px' }}>Mín</label>
              <input placeholder="0" value={rawMin}
                onChange={handleInputChange('min')}
                onBlur={handleInputBlur('min')}
                onFocus={(e) => { e.target.style.borderColor = colors.blue; }}
                style={sharedInput}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: colors.textTer, display: 'block', marginBottom: '2px' }}>Máx</label>
              <input placeholder="10.000" value={rawMax}
                onChange={handleInputChange('max')}
                onBlur={handleInputBlur('max')}
                onFocus={(e) => { e.target.style.borderColor = colors.blue; }}
                style={sharedInput}
              />
            </div>
          </div>

          <RangeSlider value={rangeVal} onChange={handleRangeChange} rangeMin={sliderMin} rangeMax={sliderMax} />
        </div>

        <button onClick={() => onFilter(filters)} style={{
          width: '100%', padding: '11px', borderRadius: '6px', border: 'none',
          background: colors.blue, color: '#FFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
          onMouseEnter={(e) => { e.target.style.background = colors.blueDark; }}
          onMouseLeave={(e) => { e.target.style.background = colors.blue; }}
        >Aplicar Filtros</button>

        {(filters.minPrice || filters.maxPrice) && (
          <button onClick={() => { setFilters({ minPrice: '', maxPrice: '' }); onFilter({ minPrice: '', maxPrice: '' }); }} style={{
            width: '100%', padding: '9px', borderRadius: '6px',
            border: `1px solid ${colors.border}`, background: '#FFF',
            color: colors.textSec, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>Limpar Filtros</button>
        )}
      </div>

      <div className="sidebar-nav-mobile" style={{
        marginTop: 'auto', borderTop: `1px solid ${colors.border}`, padding: '12px',
        display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        {(currentView === 'grid' || currentView === 'product-detail') && (
          <button onClick={() => { if (onNavigate) onNavigate('my-ads'); }} style={{
            width: '100%', padding: '10px 12px', borderRadius: '6px', border: 'none',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '10px', fontSize: '14px', color: colors.text, fontWeight: 500,
            transition: 'background 0.15s',
          }}
            onMouseEnter={(e) => { e.target.style.background = colors.blueLight; }}
            onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Meus Anúncios
          </button>
        )}

        {(currentView === 'grid' || currentView === 'product-detail') && onSync && (
          <button onClick={onSync} disabled={syncing} style={{
            width: '100%', padding: '10px 12px', borderRadius: '6px', border: 'none',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '10px', fontSize: '14px', color: colors.text, fontWeight: 500,
            transition: 'background 0.15s', opacity: syncing ? 0.5 : 1,
          }}
            onMouseEnter={(e) => { if (!syncing) e.target.style.background = colors.blueLight; }}
            onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
          >
            <div style={{ position: 'relative', display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}
              >
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {hasDivergences && <span style={{
                position: 'absolute', top: '-2px', right: '-4px', width: '8px', height: '8px',
                borderRadius: '50%', background: 'var(--ml-red)',
              }} />}
            </div>
            Sincronizar
          </button>
        )}

        <button onClick={onLogout} style={{
          width: '100%', padding: '10px 12px', borderRadius: '6px', border: 'none',
          background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
          gap: '10px', fontSize: '14px', color: '#FF4B4B', fontWeight: 500,
          transition: 'background 0.15s',
        }}
          onMouseEnter={(e) => { e.target.style.background = '#FFF0F0'; }}
          onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="sidebar-logout-text" style={{ color: '#FF4B4B' }}>Sair</span>
        </button>
      </div>
    </aside>
  );
}

export { RangeSlider, fmt as formatCurrency };
