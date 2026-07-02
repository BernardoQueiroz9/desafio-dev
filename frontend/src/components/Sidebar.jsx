import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Color palette tokens ───────────────────────────────────────
const colors = {
  blue: '#3483FA',
  blueDark: '#2968C8',
  blueLight: '#E7F0FF',
  green: '#00A650',
  greenLight: '#E7F4E8',
  text: '#333',
  textSec: '#666',
  textTer: '#999',
  border: '#E0E0E0',
  bgCard: '#FFF',
  bgBody: '#FAFAFA',
  red: '#FF4B4B',
};

const formatCurrency = (num) => {
  if (num == null || isNaN(num)) return 'R$ 0,00';
  return Number(num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPrice = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/[^\d,.]/g, '');
  const noThousandSep = cleaned.replace(/\.(\d{3})/g, '$1');
  const normalized = noThousandSep.replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ─── Range Slider (double thumb) ────────────────────────────────
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
        {/* filled track */}
        <div style={{
          position: 'absolute',
          left: `${pctMin}%`,
          width: `${pctMax - pctMin}%`,
          height: '100%',
          background: colors.blue,
          borderRadius: '3px',
        }} />
        {/* min thumb */}
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
        {/* max thumb */}
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

// ─── Image Upload ────────────────────────────────────────────────
function ImageUpload({ image, setImage }) {
  const [preview, setPreview] = useState(image || '');
  const [tab, setTab] = useState('url');
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPreview(dataUrl);
      setImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleUrl = (url) => {
    setPreview(url);
    setImage(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>
      {preview ? (
        <img src={preview} alt="Preview" style={{
          width: '100%', height: '140px', objectFit: 'contain',
          border: `1px solid ${colors.border}`, borderRadius: '6px',
          background: colors.bgBody,
        }} onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <div style={{
          width: '100%', height: '140px',
          border: `2px dashed ${colors.border}`, borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', color: colors.textTer, background: colors.bgBody,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={colors.textTer} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          Imagem do produto
        </div>
      )}
      <div style={{ display: 'flex', gap: '4px' }}>
        {['url', 'file'].map((t) => (
          <button key={t} type="button" onClick={() => { setTab(t); if (t === 'file') fileRef.current?.click(); }}
            style={{
              flex: 1, padding: '6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${tab === t ? colors.blue : colors.border}`,
              background: tab === t ? colors.blueLight : '#FFF',
              color: tab === t ? colors.blue : colors.textSec,
              transition: 'all 0.15s',
            }}
          >{t === 'url' ? 'URL' : 'Arquivo'}</button>
        ))}
      </div>
      {tab === 'url' && (
        <input
          placeholder="https://..."
          value={preview}
          onChange={(e) => handleUrl(e.target.value)}
          style={{
            width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`,
            borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.target.style.borderColor = colors.blue; }}
          onBlur={(e) => { e.target.style.borderColor = colors.border; }}
        />
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  );
}

// ─── Tab Button ─────────────────────────────────────────────────
function TabBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 4px', border: 'none', background: 'none', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
      fontSize: '11px', fontWeight: 600, color: active ? colors.blue : colors.textTer,
      borderBottom: active ? `2px solid ${colors.blue}` : '2px solid transparent',
      marginBottom: '-1px', transition: 'color 0.15s',
    }}>
      <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── Screen: Meus Anúncios ──────────────────────────────────────
function MyAdsScreen({ ads, onEdit }) {
  if (ads.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: colors.textTer }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: '8px' }}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <p style={{ fontSize: '13px', fontWeight: 600, color: colors.textSec, marginBottom: '4px' }}>Nenhum anúncio ainda</p>
        <p style={{ fontSize: '12px' }}>Crie seu primeiro anúncio na aba "Novo"</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ fontSize: '12px', color: colors.textTer, padding: '0 4px' }}>{ads.length} anúncio{ads.length > 1 ? 's' : ''}</p>
      {ads.map((ad) => (
        <div key={ad._id} style={{
          display: 'flex', gap: '10px', padding: '10px',
          border: `1px solid ${colors.border}`, borderRadius: '6px',
          background: colors.bgCard, transition: 'box-shadow 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{
            width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden',
            background: colors.bgBody, flexShrink: 0,
          }}>
            <img src={ad.image || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
              onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>{ad.title}</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: colors.text, marginBottom: '2px' }}>{formatCurrency(ad.price)}</p>
            <p style={{ fontSize: '11px', color: colors.textTer }}>Estoque: {ad.available_quantity}</p>
          </div>
          <button onClick={() => onEdit(ad)} style={{
            alignSelf: 'center', padding: '6px 10px', borderRadius: '4px',
            border: `1px solid ${colors.blue}`, background: '#FFF',
            color: colors.blue, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}
            onMouseEnter={(e) => { e.target.style.background = colors.blueLight; }}
            onMouseLeave={(e) => { e.target.style.background = '#FFF'; }}
          >Editar</button>
        </div>
      ))}
    </div>
  );
}

// ─── Screen: Novo Anúncio (card-like) ───────────────────────────
function CreateAdScreen({ formData, setFormData, onSubmit, onCancel }) {
  const [focused, setFocused] = useState(null);

  const handlePriceChange = (e) => {
    const cleaned = e.target.value.replace(/[^\d,.]/g, '');
    setFormData(prev => ({ ...prev, price: cleaned }));
  };
  const handlePriceBlur = () => {
    setFocused(null);
    setFormData(prev => ({ ...prev, price: prev.price ? formatPrice(prev.price) : '' }));
  };
  const handlePriceFocus = () => {
    setFocused('price');
    setFormData(prev => ({ ...prev, price: prev.price.replace(/\./g, '') }));
  };

  const fieldCard = (child) => (
    <div style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '10px 12px', background: colors.bgCard }}>
      {child}
    </div>
  );

  const inputStyle = (field) => ({
    width: '100%', padding: '0', border: 'none', fontSize: '14px', color: colors.text,
    outline: 'none', background: 'transparent', boxSizing: 'border-box', fontFamily: 'inherit',
  });

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Image card */}
        {fieldCard(
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textTer, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Imagem</p>
            <ImageUpload image={formData.image} setImage={(img) => setFormData(prev => ({ ...prev, image: img }))} />
          </div>
        )}

        {/* Title card */}
        {fieldCard(
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textTer, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Título</p>
            <input required placeholder="Ex: iPhone 14 Pro Max 128GB" value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={inputStyle('title')}
              onFocus={() => setFocused('title')}
              onBlur={() => setFocused(null)} />
            <div style={{ height: '2px', background: focused === 'title' ? colors.blue : 'transparent', borderRadius: '1px', marginTop: '4px', transition: 'background 0.15s' }} />
          </div>
        )}

        {/* Price + Quantity row */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {fieldCard(
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textTer, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Preço</p>
              <input required placeholder="R$ 4.999,00" value={formData.price}
                onFocus={handlePriceFocus} onBlur={handlePriceBlur} onChange={handlePriceChange}
                style={inputStyle('price')} />
              <div style={{ height: '2px', background: focused === 'price' ? colors.blue : 'transparent', borderRadius: '1px', marginTop: '4px', transition: 'background 0.15s' }} />
            </div>
          )}
          {fieldCard(
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textTer, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Estoque</p>
              <input required type="number" min="0" placeholder="10" value={formData.available_quantity}
                onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
                style={inputStyle('qty')}
                onFocus={() => setFocused('qty')}
                onBlur={() => setFocused(null)} />
              <div style={{ height: '2px', background: focused === 'qty' ? colors.blue : 'transparent', borderRadius: '1px', marginTop: '4px', transition: 'background 0.15s' }} />
            </div>
          )}
        </div>

        <button type="submit" style={{
          width: '100%', padding: '12px', borderRadius: '6px', border: 'none',
          background: colors.blue, color: '#FFF', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', transition: 'background 0.15s', marginTop: '4px',
        }}
          onMouseEnter={(e) => { e.target.style.background = colors.blueDark; }}
          onMouseLeave={(e) => { e.target.style.background = colors.blue; }}
        >{formData.id ? 'Atualizar Anúncio' : 'Publicar Anúncio'}</button>

        {formData.id && (
          <button type="button" onClick={onCancel} style={{
            width: '100%', padding: '10px', borderRadius: '6px',
            border: `1px solid ${colors.border}`, background: '#FFF',
            color: colors.textSec, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>Cancelar Edição</button>
        )}
      </form>
    </div>
  );
}

// ─── Screen: Buscar / Pesquisar ──────────────────────────────────
function SearchScreen({ filters, setFilters, onFilter, searchQuery, onSearchChange }) {
  const rangeVal = {
    min: filters.minPrice ? Number(filters.minPrice.replace(/\./g, '').replace(',', '.')) : 0,
    max: filters.maxPrice ? Number(filters.maxPrice.replace(/\./g, '').replace(',', '.')) : 10000,
  };

  const handleRangeChange = (val) => {
    const minStr = val.min > 0 ? val.min.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
    const maxStr = val.max < 10000 ? val.max.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
    setFilters({ minPrice: minStr, maxPrice: maxStr });
  };

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Search input */}
      <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: '6px', overflow: 'hidden' }}>
        <input placeholder="Buscar por título..."
          value={searchQuery || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            flex: 1, padding: '10px 12px', border: 'none', fontSize: '13px',
            outline: 'none', color: colors.text, fontFamily: 'inherit',
          }} />
        <button onClick={() => onFilter(filters)} style={{
          padding: '0 14px', border: 'none', background: colors.blue, color: '#FFF', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>

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

      {(filters.minPrice || filters.maxPrice || searchQuery) && (
        <button onClick={() => { setFilters({ minPrice: '', maxPrice: '' }); onSearchChange(''); onFilter({ minPrice: '', maxPrice: '' }); }} style={{
          width: '100%', padding: '9px', borderRadius: '6px',
          border: `1px solid ${colors.border}`, background: '#FFF',
          color: colors.textSec, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
        }}>Limpar Filtros</button>
      )}
    </div>
  );
}

// ─── Main Sidebar ───────────────────────────────────────────────
export default function Sidebar({ activeTab, onTabChange, ads, onEdit, formData, setFormData, onSubmit, onCancel, filters, setFilters, onFilter, searchQuery, onSearchChange }) {
  return (
    <aside style={{
      width: '340px', minWidth: '340px', background: colors.bgCard,
      borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Navigation tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, background: '#FAFAFA' }}>
        <TabBtn icon="📋" label="Anúncios" active={activeTab === 'list'} onClick={() => onTabChange('list')} />
        <TabBtn icon="➕" label="Novo" active={activeTab === 'create'} onClick={() => onTabChange('create')} />
        <TabBtn icon="🔍" label="Buscar" active={activeTab === 'search'} onClick={() => onTabChange('search')} />
      </div>

      {/* Content */}
      {activeTab === 'list' && <MyAdsScreen ads={ads} onEdit={onEdit} />}
      {activeTab === 'create' && (
        <CreateAdScreen formData={formData} setFormData={setFormData} onSubmit={onSubmit} onCancel={onCancel} />
      )}
      {activeTab === 'search' && (
        <SearchScreen filters={filters} setFilters={setFilters} onFilter={onFilter}
          searchQuery={searchQuery} onSearchChange={onSearchChange} />
      )}
    </aside>
  );
}

export { RangeSlider, formatCurrency };
