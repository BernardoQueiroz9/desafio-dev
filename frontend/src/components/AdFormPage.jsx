import { useState, useRef, useEffect } from 'react';
import CategoryPicker from './CategoryPicker';

const colors = {
  blue: '#3483FA', blueDark: '#2968C8', blueLight: '#E7F0FF',
  text: '#333', textSec: '#666', textTer: '#999',
  border: '#E0E0E0', bgCard: '#FFF', bgBody: '#FAFAFA',
  green: '#00A650',
};

const formatPrice = (v) => {
  if (v == null || v === '') return '';
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function AdFormPage({ formData, setFormData, onSubmit, onCancel }) {
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(null);
  const [preview, setPreview] = useState(formData.image || '');
  const [imgTab, setImgTab] = useState('url');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    setPreview(formData.image || '');
  }, [formData.image]);

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (Number(formData.available_quantity) < 1) {
      alert('Estoque deve ser no mínimo 1');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setSubmitting(false);
    }
  };

  const loadFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = (height / width) * MAX; width = MAX; }
        else { width = (width / height) * MAX; height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPreview(dataUrl);
      setFormData({ ...formData, image: dataUrl });
    };
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.readAsDataURL(file);
  };

  const handlePriceChange = (e) => {
    const cleaned = e.target.value.replace(/[^\d,.]/g, '');
    setFormData({ ...formData, price: cleaned });
  };

  const handlePriceBlur = () => {
    setFocused(null);
    const raw = formData.price.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      setFormData({ ...formData, price: formatPrice(num) });
    }
  };

  const handlePriceFocus = () => {
    setFocused('price');
    setFormData({ ...formData, price: formData.price.replace(/\./g, '') });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const fieldCard = (child, label) => (
    <div style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '14px 16px', background: colors.bgCard }}>
      {label && <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textTer, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</p>}
      {child}
    </div>
  );

  const inputStyle = {
    width: '100%', padding: '0', border: 'none', fontSize: '14px', color: colors.text,
    outline: 'none', background: 'transparent', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const toggleStyle = (active) => ({
    flex: 1,
    padding: '9px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    border: `1.5px solid ${active ? colors.blue : colors.border}`,
    background: active ? colors.blueLight : '#FFF',
    color: active ? colors.blue : colors.textSec,
    textAlign: 'center',
    transition: 'all 0.15s',
    userSelect: 'none',
  });

  return (
    <div style={{ width: '100%' }} className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: colors.text, margin: 0 }}>
          {formData.id ? 'Editar Anúncio' : 'Novo Anúncio'}
        </h2>
      </div>

      <form onSubmit={handleLocalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {fieldCard(
          <div
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ cursor: 'pointer' }}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <div style={{ position: 'relative' }}>
                <img key={preview || 'empty'} src={preview} alt="" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px', background: colors.bgBody, marginBottom: '8px' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
                {dragOver && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(52,131,250,0.08)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: colors.blue, border: `2px dashed ${colors.blue}`, pointerEvents: 'none' }}>
                    Solte para substituir
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                width: '100%', height: '160px',
                border: `2px dashed ${dragOver ? colors.blue : colors.border}`,
                borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', fontSize: '13px', color: dragOver ? colors.blue : colors.textTer,
                background: dragOver ? '#F0F7FF' : colors.bgBody, marginBottom: '8px',
                transition: 'all 0.15s',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={dragOver ? colors.blue : colors.textTer} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '6px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>Arraste uma imagem aqui</span>
                <span style={{ fontSize: '11px', marginTop: '2px', opacity: 0.6 }}>ou clique para selecionar</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['url', 'file'].map(t => (
                <button key={t} type="button" onClick={(e) => { e.stopPropagation(); setImgTab(t); if (t === 'file') fileRef.current?.click(); }}
                  style={{ flex: 1, padding: '7px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${imgTab === t ? colors.blue : colors.border}`, background: imgTab === t ? colors.blueLight : '#FFF', color: imgTab === t ? colors.blue : colors.textSec }}
                >{t === 'url' ? 'URL' : 'Arquivo'}</button>
              ))}
            </div>
            {imgTab === 'url' && (
              <input placeholder="https://..." value={preview}
                onChange={(e) => { setPreview(e.target.value); setFormData({ ...formData, image: e.target.value }); }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${colors.border}`, borderRadius: '4px', fontSize: '13px', outline: 'none', marginTop: '6px', boxSizing: 'border-box' }}
                onFocus={(e) => { e.target.style.borderColor = colors.blue; }}
                onBlur={(e) => { e.target.style.borderColor = colors.border; }}
              />
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </div>,
          'Imagem'
        )}

        {fieldCard(
          <div>
            <input required placeholder="Ex: iPhone 14 Pro Max 128GB" value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={inputStyle}
              onFocus={() => setFocused('title')} onBlur={() => setFocused(null)} />
            <div style={{ height: '2px', background: focused === 'title' ? colors.blue : 'transparent', borderRadius: '1px', marginTop: '4px', transition: 'background 0.15s' }} />
          </div>,
          'Titulo do anúncio'
        )}

        {fieldCard(
          <CategoryPicker
            value={formData.category_id}
            onChange={(catId) => setFormData({ ...formData, category_id: catId })}
          />,
          'Categoria'
        )}

        <div className="form-row" style={{ display: 'flex', gap: '14px' }}>
          <div style={{ flex: 1, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '14px 16px', background: colors.bgCard }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textTer, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Preço</p>
            <input required placeholder="R$ 4.999,00" value={formData.price}
              onFocus={handlePriceFocus} onBlur={handlePriceBlur} onChange={handlePriceChange}
              style={inputStyle} />
            <div style={{ height: '2px', background: focused === 'price' ? colors.blue : 'transparent', borderRadius: '1px', marginTop: '4px', transition: 'background 0.15s' }} />
          </div>
          <div style={{ flex: 1, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '14px 16px', background: colors.bgCard }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textTer, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Estoque</p>
            <input required type="number" min="1" placeholder="10" value={formData.available_quantity}
              onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
              style={inputStyle}
              onFocus={() => setFocused('qty')} onBlur={() => setFocused(null)} />
            <div style={{ height: '2px', background: focused === 'qty' ? colors.blue : 'transparent', borderRadius: '1px', marginTop: '4px', transition: 'background 0.15s' }} />
          </div>
        </div>

        {fieldCard(
          <textarea
            placeholder="Descreva os detalhes do produto: características, dimensões, material, garantia, etc."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{
              ...inputStyle,
              minHeight: '120px',
              resize: 'vertical',
              lineHeight: '1.5',
              padding: '2px 0',
            }}
            onFocus={() => setFocused('desc')}
            onBlur={() => setFocused(null)}
          />,
          'Detalhes do Produto'
        )}

        <div style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '14px 16px', background: colors.bgCard }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textTer, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Opções de envio</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div
              onClick={() => setFormData({ ...formData, free_shipping: !formData.free_shipping })}
              style={toggleStyle(formData.free_shipping)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  {formData.free_shipping ? (
                    <><polyline points="20 6 9 17 4 12"/></>
                  ) : (
                    <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
                  )}
                </svg>
                Frete Grátis
              </div>
            </div>
            <div
              onClick={() => setFormData({ ...formData, is_full: !formData.is_full })}
              style={toggleStyle(formData.is_full)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  {formData.is_full ? (
                    <><polyline points="20 6 9 17 4 12"/></>
                  ) : (
                    <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>
                  )}
                </svg>
                Full (Mercado Envios)
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={submitting} style={{
            flex: 1, padding: '13px', borderRadius: '6px', border: 'none',
            background: submitting ? '#B0C4DE' : colors.blue, color: '#FFF', fontSize: '14px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.15s', marginTop: '4px',
          }}
            onMouseEnter={(e) => { if (!submitting) e.target.style.background = colors.blueDark; }}
            onMouseLeave={(e) => { if (!submitting) e.target.style.background = colors.blue; }}
          >{submitting ? (formData.id ? 'Atualizando...' : 'Publicando...') : (formData.id ? 'Atualizar Anúncio' : 'Publicar Anúncio')}</button>

          <button type="button" onClick={onCancel}
            style={{ padding: '13px 20px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: '#FFF', color: colors.textSec, fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}
          >Cancelar</button>
        </div>
      </form>
    </div>
  );
}
