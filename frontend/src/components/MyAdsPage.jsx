import { useState, useEffect } from 'react';
import { api } from '../api';
import ErrorScreen from './ErrorScreen';

const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#F5F5F5" width="200" height="200"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#CCCCCC" font-family="sans-serif" font-size="14">Sem imagem</text></svg>'
);

const colors = {
  blue: '#3483FA', blueDark: '#2968C8', blueLight: '#E7F0FF',
  text: '#333', textSec: '#666', textTer: '#999',
  border: '#E0E0E0', bgCard: '#FFF', bgBody: '#FAFAFA',
  red: '#FF4B4B', green: '#00A650',
};

export default function MyAdsPage({ onEdit, onNew, fetchAds }) {
  const [myAds, setMyAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ads', { params: { mine: true } });
      setMyAds(res.data);
    } catch {
      setError('Não foi possível carregar seus anúncios. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyAds(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este anúncio?')) return;
    try {
      await api.delete(`/ads/${id}`);
      fetchMyAds();
      if (fetchAds) fetchAds();
    } catch {
      setError('Erro ao excluir o anúncio. Tente novamente.');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: colors.text, margin: '0 0 2px' }}>Meus Anúncios</h2>
          <p style={{ fontSize: '13px', color: colors.textTer, margin: 0 }}>{myAds.length} anúncio{myAds.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onNew}
          style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: colors.blue, color: '#FFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
          onMouseEnter={(e) => { e.target.style.background = colors.blueDark; }}
          onMouseLeave={(e) => { e.target.style.background = colors.blue; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Anúncio
        </button>
      </div>

      {error && !loading ? (
        <ErrorScreen message={error} onRetry={fetchMyAds} />
      ) : loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px 0' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px', border: `1px solid ${colors.border}`, borderRadius: '6px', background: colors.bgCard, alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '72px', height: '72px', borderRadius: '4px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '14px', width: '40%', marginBottom: '6px' }} />
                <div className="skeleton" style={{ height: '12px', width: '30%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : myAds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textTer }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: colors.textSec, marginBottom: '4px' }}>Nenhum anúncio ainda</p>
          <p style={{ fontSize: '13px' }}>Clique em "Novo Anúncio" para criar o primeiro.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {myAds.map(ad => (
            <div key={ad._id} className="myads-item" style={{
              display: 'flex', gap: '14px', padding: '14px',
              border: `1px solid ${colors.border}`, borderRadius: '6px',
              background: colors.bgCard, alignItems: 'center',
            }}>
              <div className="myads-item-image" style={{ width: '72px', height: '72px', borderRadius: '4px', overflow: 'hidden', background: colors.bgBody, flexShrink: 0 }}>
                <img key={ad._id} src={ad.images?.[0] || ad.image || PLACEHOLDER} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                  onError={(e) => { e.target.src = PLACEHOLDER; }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '2px' }}>{ad.title}</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: colors.text, marginBottom: '2px' }}>
                  {ad.price != null ? Number(ad.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: colors.textTer }}>Estoque: {ad.available_quantity}</span>
                  {ad.free_shipping && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: colors.green }}>Frete grátis</span>
                  )}
                  {ad.is_full && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#8B6F00', background: '#FDF0D5', padding: '1px 5px', borderRadius: '3px' }}>Full</span>
                  )}
                </div>
              </div>
              <div className="myads-item-actions" style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => onEdit(ad)}
                  style={{ padding: '8px 14px', borderRadius: '4px', border: `1px solid ${colors.blue}`, background: '#FFF', color: colors.blue, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.target.style.background = colors.blueLight; }}
                  onMouseLeave={(e) => { e.target.style.background = '#FFF'; }}
                >Editar</button>
                <button onClick={() => handleDelete(ad._id)}
                  style={{ padding: '8px 14px', borderRadius: '4px', border: `1px solid ${colors.red}55`, background: '#FFF', color: colors.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.target.style.background = '#FFF0F0'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#FFF'; }}
                >Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
