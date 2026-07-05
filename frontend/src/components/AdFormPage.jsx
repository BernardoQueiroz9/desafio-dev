import { useState, useRef, useEffect } from 'react';
import CategoryPicker from './CategoryPicker';
import { api } from '../api';

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
  const [categorySelections, setCategorySelections] = useState([]);
  const [reqAttrs, setReqAttrs] = useState([]);
  const [attrLoading, setAttrLoading] = useState(false);
  const fileRef = useRef(null);

  const hasLeafCategory = !!formData.category_id;
  const images = formData.images || [];

  // Ao escolher a categoria, busca os atributos obrigatorios dela para montar
  // os campos que o usuario precisa preencher.
  useEffect(() => {
    if (!formData.category_id) { setReqAttrs([]); return; }
    let cancelled = false;
    setAttrLoading(true);
    api.get(`/categories/${formData.category_id}/required-attributes`)
      .then((res) => { if (!cancelled) setReqAttrs(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (!cancelled) setReqAttrs([]); })
      .finally(() => { if (!cancelled) setAttrLoading(false); });
    return () => { cancelled = true; };
  }, [formData.category_id]);

  const attrEntries = formData.attributes || [];
  const getAttrValue = (attr) => {
    const found = attrEntries.find((a) => a.id === attr.id);
    return found ? (found.value_id ?? found.value_name ?? '') : '';
  };
  const setAttrValue = (attr, raw) => {
    const others = attrEntries.filter((a) => a.id !== attr.id);
    if (raw === '' || raw == null) {
      setFormData({ ...formData, attributes: others });
      return;
    }
    const entry = attr.type === 'list' ? { id: attr.id, value_id: raw } : { id: attr.id, value_name: raw };
    setFormData({ ...formData, attributes: [...others, entry] });
  };

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

  const addImage = (file) => {
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
      setFormData({ ...formData, images: [...images, dataUrl] });
    };
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updated });
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
    <div style={{ width: '100%' }} className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: colors.text, margin: 0 }}>
          {formData.id ? 'Editar Anúncio' : 'Novo Anúncio'}
        </h2>
      </div>

      <form onSubmit={handleLocalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {fieldCard(
          <div>
            {images.length === 0 ? (
              <div onClick={() => fileRef.current?.click()} style={{
                width: '100%', height: '120px', border: `2px dashed ${colors.border}`,
                borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', fontSize: '13px', color: colors.textTer, cursor: 'pointer',
                background: colors.bgBody, transition: 'all 0.15s',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textTer} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>Clique para adicionar imagem</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {images.map((src, i) => (
                  <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div onClick={() => removeImage(i)} style={{
                      position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px',
                      borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#FFF', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                    }}>✕</div>
                  </div>
                ))}
                {images.length < 5 && (
                  <div onClick={() => fileRef.current?.click()} style={{
                    width: '80px', height: '80px', borderRadius: '4px', border: `2px dashed ${colors.border}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '22px', color: colors.textTer,
                  }}>
                    <span style={{ fontSize: '22px', lineHeight: 1 }}>+</span>
                    <span style={{ fontSize: '9px', color: colors.textTer }}>Adicionar</span>
                  </div>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { addImage(f); e.target.value = ''; } }} style={{ display: 'none' }} />
            {images.length > 0 && (
              <p style={{ fontSize: '11px', color: colors.textTer, marginTop: '6px' }}>
                {images.length}/5 imagens
              </p>
            )}
          </div>,
          'Imagens'
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
          <>
            <CategoryPicker
              value={formData.category_id}
              onChange={(catId) => setFormData({ ...formData, category_id: catId, attributes: [] })}
              onSelect={(sel) => setCategorySelections(sel)}
            />
            {!hasLeafCategory && categorySelections.length > 0 && (
              <p style={{ fontSize: '12px', color: '#856404', marginTop: '8px' }}>
                Continue selecionando subcategorias até o fim da árvore
              </p>
            )}
          </>,
          'Categoria'
        )}

        {hasLeafCategory && (attrLoading || reqAttrs.length > 0) && (
          <div style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '14px 16px', background: colors.bgCard }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textTer, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Ficha técnica (exigida pela categoria)
            </p>
            {attrLoading ? (
              <p style={{ fontSize: '13px', color: colors.textTer }}>Carregando campos obrigatórios...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reqAttrs.map((attr) => (
                  <div key={attr.id}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSec, marginBottom: '4px' }}>
                      {attr.name}
                      {attr.validated && <span style={{ color: colors.textTer, fontWeight: 400 }}> (valor será validado pelo Mercado Livre)</span>}
                    </label>
                    {attr.type === 'list' ? (
                      <select
                        required
                        value={getAttrValue(attr)}
                        onChange={(e) => setAttrValue(attr, e.target.value)}
                        style={{ width: '100%', padding: '9px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', color: colors.text, background: '#FFF', fontFamily: 'inherit' }}
                      >
                        <option value="">Selecione...</option>
                        {attr.values.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required
                        value={getAttrValue(attr)}
                        onChange={(e) => setAttrValue(attr, e.target.value)}
                        placeholder={attr.hint || `Informe ${attr.name.toLowerCase()}`}
                        style={{ width: '100%', padding: '9px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', color: colors.text, background: '#FFF', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
              style={{
                flex: 1, padding: '9px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', border: `1.5px solid ${formData.free_shipping ? colors.blue : colors.border}`,
                background: formData.free_shipping ? colors.blueLight : '#FFF',
                color: formData.free_shipping ? colors.blue : colors.textSec, textAlign: 'center',
                transition: 'all 0.15s', userSelect: 'none',
              }}
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
              style={{
                flex: 1, padding: '9px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', border: `1.5px solid ${formData.is_full ? colors.blue : colors.border}`,
                background: formData.is_full ? colors.blueLight : '#FFF',
                color: formData.is_full ? colors.blue : colors.textSec, textAlign: 'center',
                transition: 'all 0.15s', userSelect: 'none',
              }}
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
          <button type="submit" disabled={!hasLeafCategory || submitting} style={{
            flex: 1, padding: '13px', borderRadius: '6px', border: 'none',
            background: !hasLeafCategory ? '#CCC' : (submitting ? '#B0C4DE' : colors.blue), color: '#FFF', fontSize: '14px', fontWeight: 700, cursor: !hasLeafCategory || submitting ? 'not-allowed' : 'pointer', transition: 'background 0.15s', marginTop: '4px',
          }}
            onMouseEnter={(e) => { if (!submitting && hasLeafCategory) e.target.style.background = colors.blueDark; }}
            onMouseLeave={(e) => { if (!submitting && hasLeafCategory) e.target.style.background = colors.blue; }}
          >{submitting ? (formData.id ? 'Atualizando...' : 'Publicando...') : (formData.id ? 'Atualizar Anúncio' : 'Publicar Anúncio')}</button>

          <button type="button" onClick={onCancel}
            style={{ padding: '13px 20px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: '#FFF', color: colors.textSec, fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}
          >Cancelar</button>
        </div>
      </form>
    </div>
  );
}
