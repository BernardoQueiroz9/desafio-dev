import { useState, useRef } from 'react';

const styles = {
  sidebar: {
    width: '300px',
    minWidth: '300px',
    background: 'var(--ml-bg-card)',
    borderRight: '1px solid var(--ml-border)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  section: {
    borderBottom: '1px solid var(--ml-border)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background 0.15s',
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--ml-text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  chevron: {
    transition: 'transform 0.2s',
    color: 'var(--ml-text-tertiary)',
  },
  chevronOpen: {
    transform: 'rotate(180deg)',
  },
  sectionBody: {
    padding: '0 20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--ml-text-secondary)',
    marginBottom: '-4px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--ml-border)',
    borderRadius: '4px',
    fontSize: '14px',
    color: 'var(--ml-text-primary)',
    background: 'var(--ml-bg-card)',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  inputFocus: {
    borderColor: 'var(--ml-blue)',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--ml-border)',
    borderRadius: '4px',
    fontSize: '14px',
    color: 'var(--ml-text-primary)',
    background: 'var(--ml-bg-card)',
    outline: 'none',
    resize: 'vertical',
    minHeight: '60px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  btnPrimary: {
    background: 'var(--ml-blue)',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
    width: '100%',
  },
  btnSecondary: {
    background: '#fff',
    color: 'var(--ml-blue)',
    border: '1px solid var(--ml-blue)',
    padding: '10px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    width: '100%',
  },
  imagePreview: {
    width: '100%',
    height: '120px',
    objectFit: 'contain',
    border: '1px solid var(--ml-border)',
    borderRadius: '4px',
    background: '#FAFAFA',
  },
  imagePreviewPlaceholder: {
    width: '100%',
    height: '120px',
    border: '2px dashed var(--ml-border)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: 'var(--ml-text-tertiary)',
    background: '#FAFAFA',
  },
  fileInputWrapper: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  fileBtn: {
    background: '#fff',
    color: 'var(--ml-text-secondary)',
    border: '1px solid var(--ml-border)',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    whiteSpace: 'nowrap',
  },
  urlHint: {
    fontSize: '11px',
    color: 'var(--ml-text-tertiary)',
    marginTop: '-4px',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  filterInput: {
    flex: 1,
    padding: '8px 10px',
    border: '1px solid var(--ml-border)',
    borderRadius: '4px',
    fontSize: '13px',
    color: 'var(--ml-text-primary)',
    outline: 'none',
    background: 'var(--ml-bg-card)',
    boxSizing: 'border-box',
  },
  filterLabel: {
    fontSize: '12px',
    color: 'var(--ml-text-secondary)',
    fontWeight: 500,
  },
  divider: {
    height: '1px',
    background: 'var(--ml-border)',
    margin: '8px 0',
  },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {preview ? (
        <img src={preview} alt="Preview" style={styles.imagePreview} onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <div style={styles.imagePreviewPlaceholder}>Pré-visualização da imagem</div>
      )}

      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          type="button"
          onClick={() => setTab('url')}
          style={{
            ...styles.fileBtn,
            borderColor: tab === 'url' ? 'var(--ml-blue)' : 'var(--ml-border)',
            color: tab === 'url' ? 'var(--ml-blue)' : 'var(--ml-text-secondary)',
            flex: 1,
          }}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => { setTab('file'); fileRef.current?.click(); }}
          style={{
            ...styles.fileBtn,
            borderColor: tab === 'file' ? 'var(--ml-blue)' : 'var(--ml-border)',
            color: tab === 'file' ? 'var(--ml-blue)' : 'var(--ml-text-secondary)',
            flex: 1,
          }}
        >
          Arquivo
        </button>
      </div>

      {tab === 'url' && (
        <>
          <input
            style={styles.input}
            placeholder="https://..."
            value={preview}
            onChange={(e) => handleUrl(e.target.value)}
            onFocus={(e) => { e.target.style.borderColor = 'var(--ml-blue)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--ml-border)'; }}
          />
          <span style={styles.urlHint}>Cole o link da imagem do produto</span>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  );
}

function Section({ icon, title, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <div style={styles.section}>
      <div
        style={styles.sectionHeader}
        onClick={() => setOpen(!open)}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(!open); }}
        aria-expanded={open}
      >
        <span style={styles.sectionTitle}>
          <span>{icon}</span>
          {title}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ ...styles.chevron, ...(open ? styles.chevronOpen : {}) }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {open && <div style={styles.sectionBody}>{children}</div>}
    </div>
  );
}

export function AddAdSection({ formData, setFormData, onSubmit, onCancel }) {
  const [focusedField, setFocusedField] = useState(null);

  const handlePriceChange = (e) => {
    const cleaned = e.target.value.replace(/[^\d,.]/g, '');
    setFormData(prev => ({ ...prev, price: cleaned }));
  };

  const handlePriceBlur = () => {
    setFocusedField(null);
    setFormData(prev => ({
      ...prev,
      price: prev.price ? formatPrice(prev.price) : ''
    }));
  };

  const handlePriceFocus = () => {
    setFocusedField('price');
    setFormData(prev => ({ ...prev, price: prev.price.replace(/\./g, '') }));
  };

  const inputStyle = (field) => ({
    ...styles.input,
    borderColor: focusedField === field ? 'var(--ml-blue)' : 'var(--ml-border)',
  });

  return (
    <Section icon="📦" title="Novo Anúncio" defaultOpen>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <span style={styles.label}>Imagem do produto</span>
          <ImageUpload
            image={formData.image}
            setImage={(img) => setFormData(prev => ({ ...prev, image: img }))}
          />
        </div>

        <div>
          <span style={styles.label}>Título do anúncio</span>
          <input
            required
            placeholder="Ex: iPhone 14 Pro Max 128GB"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={inputStyle('title')}
            onFocus={() => setFocusedField('title')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        <div>
          <span style={styles.label}>Preço</span>
          <input
            required
            placeholder="R$ 4.999,00"
            value={formData.price}
            onFocus={handlePriceFocus}
            onBlur={handlePriceBlur}
            onChange={handlePriceChange}
            style={inputStyle('price')}
          />
        </div>

        <div>
          <span style={styles.label}>Quantidade em estoque</span>
          <input
            required
            type="number"
            min="0"
            placeholder="10"
            value={formData.available_quantity}
            onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
            style={inputStyle('qty')}
            onFocus={() => setFocusedField('qty')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        <button
          type="submit"
          style={styles.btnPrimary}
          onMouseEnter={(e) => { e.target.style.background = 'var(--ml-blue-dark)'; }}
          onMouseLeave={(e) => { e.target.style.background = 'var(--ml-blue)'; }}
        >
          {formData.id ? 'Atualizar Anúncio' : 'Publicar Anúncio'}
        </button>

        {formData.id && (
          <button type="button" style={styles.btnSecondary} onClick={onCancel}>
            Cancelar Edição
          </button>
        )}
      </form>
    </Section>
  );
}

export function FilterSection({ filters, setFilters, onFilter }) {
  const [focusedField, setFocusedField] = useState(null);

  const handleMinFocus = () => {
    setFocusedField('minPrice');
    setFilters(prev => ({ ...prev, minPrice: prev.minPrice.replace(/\./g, '') }));
  };

  const handleMinBlur = () => {
    setFocusedField(null);
    setFilters(prev => ({
      ...prev,
      minPrice: prev.minPrice ? formatPrice(prev.minPrice) : ''
    }));
  };

  const handleMaxFocus = () => {
    setFocusedField('maxPrice');
    setFilters(prev => ({ ...prev, maxPrice: prev.maxPrice.replace(/\./g, '') }));
  };

  const handleMaxBlur = () => {
    setFocusedField(null);
    setFilters(prev => ({
      ...prev,
      maxPrice: prev.maxPrice ? formatPrice(prev.maxPrice) : ''
    }));
  };

  const inputStyle = (field) => ({
    ...styles.filterInput,
    borderColor: focusedField === field ? 'var(--ml-blue)' : 'var(--ml-border)',
  });

  return (
    <Section icon="🔍" title="Buscar / Filtros">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={styles.filterLabel}>Faixa de preço</span>
        <div style={styles.filterRow}>
          <input
            placeholder="Mín"
            value={filters.minPrice}
            onFocus={handleMinFocus}
            onBlur={handleMinBlur}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value.replace(/[^\d,.]/g, '') })}
            style={inputStyle('minPrice')}
          />
          <span style={{ color: 'var(--ml-text-tertiary)', fontSize: '13px' }}>até</span>
          <input
            placeholder="Máx"
            value={filters.maxPrice}
            onFocus={handleMaxFocus}
            onBlur={handleMaxBlur}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value.replace(/[^\d,.]/g, '') })}
            style={inputStyle('maxPrice')}
          />
        </div>

        <button
          type="button"
          style={styles.btnPrimary}
          onClick={onFilter}
          onMouseEnter={(e) => { e.target.style.background = 'var(--ml-blue-dark)'; }}
          onMouseLeave={(e) => { e.target.style.background = 'var(--ml-blue)'; }}
        >
          Aplicar Filtros
        </button>

        {(filters.minPrice || filters.maxPrice) && (
          <button
            type="button"
            style={styles.btnSecondary}
            onClick={() => {
              setFilters({ minPrice: '', maxPrice: '' });
              onFilter({ minPrice: '', maxPrice: '' });
            }}
          >
            Limpar Filtros
          </button>
        )}
      </div>
    </Section>
  );
}

export default function Sidebar({ formData, setFormData, onSubmit, onCancel, filters, setFilters, onFilter }) {
  return (
    <aside style={styles.sidebar}>
      <AddAdSection
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
      <FilterSection
        filters={filters}
        setFilters={setFilters}
        onFilter={onFilter}
      />
    </aside>
  );
}
