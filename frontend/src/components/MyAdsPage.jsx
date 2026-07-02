import { useState, useEffect } from 'react';
import { api } from '../api';

const colors = {
  blue: '#3483FA', blueDark: '#2968C8', blueLight: '#E7F0FF',
  text: '#333', textSec: '#666', textTer: '#999',
  border: '#E0E0E0', bgCard: '#FFF', bgBody: '#FAFAFA',
  red: '#FF4B4B',
};

export default function MyAdsPage({ onEdit, onNew, fetchAds }) {
  const [myAds, setMyAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ads');
      setMyAds(res.data);
    } catch { /* ignore */ } finally {
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
      alert('Erro ao excluir');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: colors.text, margin: '0 0 2px' }}>Meus Anúncios</h2>
          <p style={{ fontSize: '13px', color: colors.textTer, margin: 0 }}>{myAds.length} anúncio{myAds.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onNew}
          style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: colors.blue, color: '#FFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          onMouseEnter={(e) => { e.target.style.background = colors.blueDark; }}
          onMouseLeave={(e) => { e.target.style.background = colors.blue; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Anúncio
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: colors.textTer, padding: '40px' }}>Carregando...</p>
      ) : myAds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textTer }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: colors.textSec, marginBottom: '4px' }}>Nenhum anúncio ainda</p>
          <p style={{ fontSize: '13px' }}>Clique em "Novo Anúncio" para criar o primeiro.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {myAds.map(ad => (
            <div key={ad._id} style={{
              display: 'flex', gap: '14px', padding: '14px',
              border: `1px solid ${colors.border}`, borderRadius: '6px',
              background: colors.bgCard, alignItems: 'center',
            }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '4px', overflow: 'hidden', background: colors.bgBody, flexShrink: 0 }}>
                <img src={ad.image || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '2px' }}>{ad.title}</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: colors.text, marginBottom: '2px' }}>
                  {ad.price != null ? Number(ad.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}
                </p>
                <p style={{ fontSize: '12px', color: colors.textTer }}>Estoque: {ad.available_quantity}</p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
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
