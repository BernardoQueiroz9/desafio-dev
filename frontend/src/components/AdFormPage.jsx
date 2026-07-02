import { useState, useRef } from 'react';

const colors = {
  blue: '#3483FA', blueDark: '#2968C8', blueLight: '#E7F0FF',
  text: '#333', textSec: '#666', textTer: '#999',
  border: '#E0E0E0', bgCard: '#FFF', bgBody: '#FAFAFA',
};

const formatPrice = (v) => {
  if (v == null || v === '') return '';
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function AdFormPage({ formData, setFormData, onSubmit, onCancel, onBack }) {
  const [focused, setFocused] = useState(null);
  const [preview, setPreview] = useState(formData.image || '');
  const [imgTab, setImgTab] = useState('url');
  const fileRef = useRef(null);

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
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPreview(dataUrl);
      setFormData({ ...formData, image: dataUrl });
    };
    reader.readAsDataURL(file);
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

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: colors.text, margin: 0 }}>
          {formData.id ? 'Editar Anúncio' : 'Novo Anúncio'}
        </h2>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {fieldCard(
          <div>
            {preview ? (
              <img src={preview} alt="" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px', background: colors.bgBody, marginBottom: '8px' }}
                onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <div style={{ width: '100%', height: '160px', border: `2px dashed ${colors.border}`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: colors.textTer, background: colors.bgBody, marginBottom: '8px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={colors.textTer} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                Imagem do produto
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['url', 'file'].map(t => (
                <button key={t} type="button" onClick={() => { setImgTab(t); if (t === 'file') fileRef.current?.click(); }}
                  style={{ flex: 1, padding: '7px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${imgTab === t ? colors.blue : colors.border}`, background: imgTab === t ? colors.blueLight : '#FFF', color: imgTab === t ? colors.blue : colors.textSec }}
                >{t === 'url' ? 'URL' : 'Arquivo'}</button>
              ))}
            </div>
            {imgTab === 'url' && (
              <input placeholder="https://..." value={preview}
                onChange={(e) => { setPreview(e.target.value); setFormData({ ...formData, image: e.target.value }); }}
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
          'Título do anúncio'
        )}

        <div style={{ display: 'flex', gap: '14px' }}>
          <div style={{ flex: 1, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '14px 16px', background: colors.bgCard }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textTer, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Preço</p>
            <input required placeholder="R$ 4.999,00" value={formData.price}
              onFocus={handlePriceFocus} onBlur={handlePriceBlur} onChange={handlePriceChange}
              style={inputStyle} />
            <div style={{ height: '2px', background: focused === 'price' ? colors.blue : 'transparent', borderRadius: '1px', marginTop: '4px', transition: 'background 0.15s' }} />
          </div>
          <div style={{ flex: 1, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '14px 16px', background: colors.bgCard }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textTer, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Estoque</p>
            <input required type="number" min="0" placeholder="10" value={formData.available_quantity}
              onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
              style={inputStyle}
              onFocus={() => setFocused('qty')} onBlur={() => setFocused(null)} />
            <div style={{ height: '2px', background: focused === 'qty' ? colors.blue : 'transparent', borderRadius: '1px', marginTop: '4px', transition: 'background 0.15s' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{
            flex: 1, padding: '13px', borderRadius: '6px', border: 'none',
            background: colors.blue, color: '#FFF', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s', marginTop: '4px',
          }}
            onMouseEnter={(e) => { e.target.style.background = colors.blueDark; }}
            onMouseLeave={(e) => { e.target.style.background = colors.blue; }}
          >{formData.id ? 'Atualizar Anúncio' : 'Publicar Anúncio'}</button>

          <button type="button" onClick={() => { onCancel(); onBack(); }}
            style={{ padding: '13px 20px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: '#FFF', color: colors.textSec, fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}
          >Cancelar</button>
        </div>
      </form>
    </div>
  );
}
