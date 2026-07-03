import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';

const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#F5F5F5" width="400" height="400"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#CCCCCC" font-family="sans-serif" font-size="20">Sem imagem</text></svg>'
);

const THUMB = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#F5F5F5" width="80" height="80"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#CCC" font-family="sans-serif" font-size="10">?</text></svg>'
);

const formatPrice = (num) => {
  if (num === null || num === undefined) return '';
  return Number(num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const s = {
  page: { width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'none', border: 'none', color: 'var(--ml-blue)', cursor: 'pointer',
    fontSize: '14px', fontWeight: 500, padding: '8px 0', marginBottom: '20px',
    fontFamily: 'inherit',
  },
  content: { display: 'flex', gap: '32px', alignItems: 'flex-start' },
  imageCol: { flex: '1 1 55%', minWidth: 0 },
  imageBox: {
    width: '100%', background: '#FFF', borderRadius: '4px',
    border: '1px solid var(--ml-border)', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  },
  image: { width: '100%', maxHeight: '400px', objectFit: 'contain' },
  infoCol: { flex: '1 1 45%', minWidth: 0 },
  title: { fontSize: '22px', fontWeight: 600, color: 'var(--ml-text-primary)', lineHeight: '1.3', marginBottom: '12px' },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' },
  price: { fontSize: '36px', fontWeight: 300, color: 'var(--ml-text-primary)', letterSpacing: '-0.5px' },
  divider: { height: '1px', background: 'var(--ml-border)', margin: '16px 0' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '14px', color: 'var(--ml-text-secondary)' },
  infoLabel: { fontWeight: 600, color: 'var(--ml-text-primary)', minWidth: '100px' },
  badgesRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
  shippingBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '13px', fontWeight: 600, color: 'var(--ml-green)',
    padding: '4px 10px', borderRadius: '4px', background: 'var(--ml-green-light)',
  },
  fullBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 700, color: '#8B6F00',
    background: '#FDF0D5', padding: '4px 8px', borderRadius: '4px',
    textTransform: 'uppercase', letterSpacing: '0.3px',
  },
  descSection: { marginTop: '32px' },
  descTitle: { fontSize: '18px', fontWeight: 600, color: 'var(--ml-text-primary)', marginBottom: '12px' },
  descText: {
    fontSize: '14px', lineHeight: '1.7', color: 'var(--ml-text-secondary)',
    whiteSpace: 'pre-wrap', background: '#FFF', padding: '20px',
    borderRadius: '4px', border: '1px solid var(--ml-border)',
  },
  loadingWrap: { display: 'flex', justifyContent: 'center', padding: '80px 20px' },
  errorWrap: { textAlign: 'center', padding: '80px 20px', color: 'var(--ml-text-tertiary)' },
};

export default function ProductDetailPage({ userName: propUserName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const id = pathParts[2];
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const sellerName = propUserName || localStorage.getItem('userName') || 'Vendedor';

  useEffect(() => {
    if (!id) {
      setError('ID do anúncio não encontrado');
      setLoading(false);
      return;
    }
    api.get(`/ads/${id}`).then(res => {
      setAd(res.data);
      setLoading(false);
    }).catch(() => {
      setError('Anúncio não encontrado');
      setLoading(false);
    });
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate('/dashboard');
  };

  if (loading) {
    return (
      <div style={{ flex: 1, background: 'var(--ml-bg)' }}>
        <div style={s.page}>
          <div style={s.loadingWrap}>
            <div style={{ display: 'flex', gap: '24px', width: '100%', flexWrap: 'wrap' }}>
              <div className="skeleton" style={{ flex: '1 1 55%', height: '400px', borderRadius: '4px' }} />
              <div style={{ flex: '1 1 40%' }}>
                <div className="skeleton" style={{ height: '24px', width: '80%', marginBottom: '16px' }} />
                <div className="skeleton" style={{ height: '36px', width: '50%', marginBottom: '16px' }} />
                <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '16px', width: '40%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div style={{ flex: 1, background: 'var(--ml-bg)' }}>
        <div style={s.page}>
          <div style={s.errorWrap}>
            <h3>{error || 'Anúncio não encontrado'}</h3>
            <button onClick={handleBack} style={s.backBtn}>← Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  const allImages = ad.images?.length ? ad.images : (ad.image ? [ad.image] : []);
  const currentImage = allImages[selectedImage] || PLACEHOLDER;

  return (
    <div style={{ flex: 1, background: 'var(--ml-bg)' }}>
      <div style={s.page} className="page-enter">
        <button onClick={handleBack} style={s.backBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Voltar
        </button>

        <div className="pd-content" style={s.content}>
          <div className="pd-image-col" style={s.imageCol}>
            <div style={s.imageBox}>
              <img key={selectedImage} src={currentImage} alt={ad.title} style={s.image}
                onError={(e) => { e.target.src = PLACEHOLDER; }} />
            </div>
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                {allImages.map((src, i) => (
                  <div key={i} onClick={() => setSelectedImage(i)} style={{
                    width: '56px', height: '56px', borderRadius: '4px', overflow: 'hidden',
                    cursor: 'pointer', border: `2px solid ${i === selectedImage ? 'var(--ml-blue)' : 'var(--ml-border)'}`,
                    opacity: i === selectedImage ? 1 : 0.6, transition: 'all 0.15s',
                  }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = THUMB; }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pd-info-col" style={s.infoCol}>
            <h1 style={s.title}>{ad.title}</h1>

            <div style={s.priceRow}>
              <span style={s.price}>{formatPrice(ad.price)}</span>
            </div>

            <div style={s.badgesRow}>
              {ad.free_shipping && (
                <div style={s.shippingBadge}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L11 4.5L8 8L5 4.5L8 1Z" fill="currentColor"/>
                    <path d="M1 8L4.5 5L8 8L4.5 11L1 8Z" fill="currentColor"/>
                    <path d="M8 8L11 11L8 15L5 11L8 8Z" fill="currentColor"/>
                    <path d="M15 8L11 5L8 8L11 11L15 8Z" fill="currentColor"/>
                  </svg>
                  Frete grátis
                </div>
              )}
              {ad.is_full && (
                <div style={s.fullBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#8B6F00">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  Full
                </div>
              )}
            </div>

            <div style={s.divider} />

            <div style={s.infoRow}>
              <span style={s.infoLabel}>Vendedor</span>
              <span>{sellerName}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Estoque</span>
              <span>{ad.available_quantity} unidade{ad.available_quantity !== 1 ? 's' : ''}</span>
            </div>
            {ad.condition && (
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Condição</span>
                <span>{ad.condition}</span>
              </div>
            )}
            {(ad.category_name || ad.category_id) && (
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Categoria</span>
                <span>{ad.category_name || ad.category_id}</span>
              </div>
            )}
          </div>
        </div>

        {ad.description && (
          <div className="pd-desc-section" style={s.descSection}>
            <h2 style={s.descTitle}>Detalhes do Produto</h2>
            <div style={s.descText}>{ad.description}</div>
          </div>
        )}
      </div>
    </div>
  );
}
