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

const formatCurrency = (num) => {
  if (num == null || isNaN(num)) return 'R$ 0,00';
  return Number(num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

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
      const val = posToVal(e.clientX);
      if (drag === 'min') {
        onChange({ ...value, min: Math.min(val, value.max) });
      } else {
        onChange({ ...value, max: Math.max(val, value.min) });
      }
    };
    const handleUp = () => setDrag(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [drag, posToVal, value, onChange]);

  const pctMin = ((value.min - rangeMin) / (rangeMax - rangeMin)) * 100;
  const pctMax = ((value.max - rangeMin) / (rangeMax - rangeMin)) * 100;

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.textTer, marginBottom: '6px' }}>
        <span>{formatCurrency(value.min)}</span>
        <span>{formatCurrency(value.max)}</span>
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
          style={{
            position: 'absolute',
            top: '50%',
            left: `${pctMin}%`,
            width: '18px',
            height: '18px',
            background: '#FFF',
            border: `2px solid ${colors.blue}`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'grab',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            zIndex: drag === 'min' ? 2 : 1,
          }}
        />
        <div
          onMouseDown={handleMouseDown('max')}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${pctMax}%`,
            width: '18px',
            height: '18px',
            background: '#FFF',
            border: `2px solid ${colors.blue}`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'grab',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            zIndex: drag === 'max' ? 2 : 1,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: colors.textTer, marginTop: '4px' }}>
        <span>R$ 0</span>
        <span>R$ 10.000</span>
      </div>
    </div>
  );
}

export default function Sidebar({ filters, setFilters, onFilter, collapsed, onToggleCollapse }) {
  const rangeVal = {
    min: filters.minPrice ? Number(filters.minPrice.replace(/\./g, '').replace(',', '.')) : 0,
    max: filters.maxPrice ? Number(filters.maxPrice.replace(/\./g, '').replace(',', '.')) : 10000,
  };

  const handleRangeChange = (val) => {
    const minStr = val.min > 0 ? val.min.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
    const maxStr = val.max < 10000 ? val.max.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
    setFilters({ minPrice: minStr, maxPrice: maxStr });
  };

  if (collapsed) {
    return (
      <aside style={{
        width: '40px', minWidth: '40px', background: colors.bgCard,
        borderRight: `1px solid ${colors.border}`, display: 'flex',
        flexDirection: 'column', alignItems: 'center', paddingTop: '8px',
      }}>
        <button onClick={onToggleCollapse} title="Expandir filtros"
          style={{
            width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${colors.border}`,
            background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: colors.textSec, fontSize: '14px', lineHeight: 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.target.style.background = colors.blueLight; e.target.style.borderColor = colors.blue; e.target.style.color = colors.blue; }}
          onMouseLeave={(e) => { e.target.style.background = '#FFF'; e.target.style.borderColor = colors.border; e.target.style.color = colors.textSec; }}
        >▶</button>
      </aside>
    );
  }

  return (
    <aside style={{
      width: '300px', minWidth: '300px', background: colors.bgCard,
      borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column',
      overflowY: 'auto', transition: 'width 0.2s',
    }}>
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 12px 8px',
      }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: colors.text }}>Filtros</span>
        <button onClick={onToggleCollapse} title="Recolher filtros"
          style={{
            width: '28px', height: '28px', borderRadius: '4px', border: 'none',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: colors.textTer, fontSize: '13px', lineHeight: 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.target.style.background = colors.border; e.target.style.color = colors.text; }}
          onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = colors.textTer; }}
        >◀</button>
      </div>

      <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Price range */}
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '12px', background: colors.bgCard }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: colors.textSec, marginBottom: '8px' }}>Faixa de preço</p>
          <RangeSlider value={rangeVal} onChange={handleRangeChange} rangeMin={0} rangeMax={10000} />
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
    </aside>
  );
}

export { RangeSlider, formatCurrency };
