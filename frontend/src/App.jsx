import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import Sidebar from './components/Sidebar';
import SyncPanel from './components/SyncPanel';
import AdFormPage from './components/AdFormPage';
import MyAdsPage from './components/MyAdsPage';

const unmaskPrice = (masked) => {
  if (!masked) return '';
  return parseFloat(masked.replace(/\./g, '').replace(',', '.'));
};

function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(() => localStorage.getItem('rememberMe') === 'true');


  useEffect(() => {
    if (localStorage.getItem('userId')) navigate('/dashboard', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (localStorage.getItem('rememberMe') === 'true') {
      setEmail(localStorage.getItem('savedEmail') || '');
      setPassword(localStorage.getItem('savedPassword') || '');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'register') {
      if (name.trim().length < 3) {
        setError('Nome deve ter no mínimo 3 caracteres');
        return;
      }
      if (password.length < 6) {
        setError('Senha deve ter no mínimo 6 caracteres');
        return;
      }
    }

    setLoading(true);
    try {
      const route = tab === 'login' ? '/auth/login' : '/auth/register';
      const body = tab === 'login' ? { email, password } : { name, email, password };
      const res = await api.post(route, body);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('userName', res.data.name);
      if (remember) {
        localStorage.setItem('savedEmail', email);
        localStorage.setItem('savedPassword', password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('savedPassword');
        localStorage.removeItem('rememberMe');
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (!err.response) {
        setError('Servidor indisponível — verifique se o backend está rodando');
      } else {
        setError(err.response?.data?.error || 'Erro na requisição');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ml-yellow)',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#333',
            letterSpacing: '-0.5px',
            marginBottom: '4px',
          }}>
            Desafio<span style={{ color: 'var(--ml-blue)' }}>ML</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--ml-text-tertiary)' }}>
            {tab === 'login' ? 'Entre com sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {tab === 'login' && (
          <p style={{ fontSize: '13px', color: 'var(--ml-text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
            Não tem conta?{' '}
            <button
              onClick={() => { setTab('register'); setError(''); setEmail(''); setPassword(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--ml-blue)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
            >
              Criar uma conta
            </button>
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tab === 'register' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ml-text-secondary)', display: 'block', marginBottom: '4px' }}>
                Nome
              </label>
              <input
                required
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--ml-border)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--ml-blue)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--ml-border)'; }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ml-text-secondary)', display: 'block', marginBottom: '4px' }}>
              Email
            </label>
            <input
              required
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--ml-border)',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--ml-blue)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--ml-border)'; }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ml-text-secondary)', display: 'block', marginBottom: '4px' }}>
              Senha
            </label>
            <input
              required
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--ml-border)',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--ml-blue)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--ml-border)'; }}
            />
          </div>

          {tab === 'login' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ml-text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={remember} onChange={(e) => {
                const val = e.target.checked;
                setRemember(val);
                if (!val) {
                  localStorage.removeItem('savedEmail');
                  localStorage.removeItem('savedPassword');
                  localStorage.removeItem('rememberMe');
                }
              }} style={{ accentColor: 'var(--ml-blue)', cursor: 'pointer' }} />
              Lembrar de mim
            </label>
          )}

          {error && (
            <p style={{ color: 'var(--ml-red)', fontSize: '13px', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#93b8f5' : 'var(--ml-blue)',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              transition: 'background 0.15s',
              marginTop: '4px',
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = 'var(--ml-blue-dark)'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.background = 'var(--ml-blue)'; }}
          >
            {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>

          {tab === 'register' && (
            <p style={{ fontSize: '13px', color: 'var(--ml-text-secondary)', textAlign: 'center', margin: 0 }}>
              Já tem conta?{' '}
              <button
                onClick={() => { setTab('login'); setError(''); setEmail(remember ? localStorage.getItem('savedEmail') || '' : ''); setPassword(remember ? localStorage.getItem('savedPassword') || '' : ''); setName(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--ml-blue)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
              >
                Fazer login
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '' });
  const [formData, setFormData] = useState({
    id: null, title: '', price: '', available_quantity: '', image: ''
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncData, setSyncData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState('grid'); // 'grid' | 'my-ads' | 'form'

  const userName = localStorage.getItem('userName') || 'Vendedor';

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/', { replace: true });
      return;
    }
    api.get('/ads').then(res => setAds(res.data)).catch(console.error);
  }, [navigate]);

  const formatPrice = (v) => {
    if (v == null || v === '') return '';
    return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchAds = async (f, q) => {
    try {
      const params = {};
      const minP = f?.minPrice || filters.minPrice;
      const maxP = f?.maxPrice || filters.maxPrice;
      const query = q ?? searchQuery;
      if (minP) params.minPrice = unmaskPrice(minP);
      if (maxP) params.maxPrice = unmaskPrice(maxP);
      if (query) params.search = query;
      const res = await api.get('/ads', { params });
      setAds(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/ads/sync');
      setSyncData(res.data);
    } catch {
      alert('Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAccept = async (adId, marketplace) => {
    if (!marketplace) {
      setSyncData(prev => ({
        ...prev,
        divergences: prev.divergences.filter(d => d._id !== adId),
      }));
      return;
    }
    try {
      await api.put(`/ads/${adId}`, {
        title: marketplace.title,
        price: marketplace.price,
        available_quantity: marketplace.available_quantity,
      });
      setSyncData(prev => ({
        ...prev,
        divergences: prev.divergences.filter(d => d._id !== adId),
      }));
      fetchAds();
    } catch {
      alert('Erro ao atualizar');
    }
  };

  const handleSyncAcceptAll = async () => {
    if (!syncData) return;
    for (const item of syncData.divergences) {
      await handleSyncAccept(item._id, item.marketplace);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: unmaskPrice(formData.price)
      };
      if (formData.id) {
        await api.put(`/ads/${formData.id}`, payload);
      } else {
        await api.post('/ads', payload);
      }
      resetForm();
      setView('my-ads');
      fetchAds();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro na requisição';
      console.error('Submit error:', err);
      alert(msg);
    }
  };

  const resetForm = () => {
    setFormData({ id: null, title: '', price: '', available_quantity: '', image: '' });
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('savedEmail');
    localStorage.removeItem('savedPassword');
    localStorage.removeItem('rememberMe');
    navigate('/');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchAds(filters, query);
  };

  const handleFilter = (overrideFilters) => {
    const f = overrideFilters || filters;
    fetchAds(f, searchQuery);
  };

  const handleEditAd = (ad) => {
    setFormData({
      id: ad._id,
      title: ad.title,
      price: formatPrice(ad.price),
      available_quantity: ad.available_quantity ?? '',
      image: ad.image || '',
    });
    setView('form');
  };

  const hasDivergences = syncData && syncData.divergences.length > 0;

  // ─── Main render ────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        onSearch={handleSearch}
        searchValue={searchQuery}
        onLogout={handleLogout}
        userName={userName}
        onSync={handleSync}
        syncing={syncing}
        hasDivergences={hasDivergences}
        currentView={view}
        onViewChange={setView}
      />

      <div style={{
        display: 'flex',
        flex: 1,
        maxWidth: view === 'grid' ? '1200px' : '100%',
        width: '100%',
        margin: '0 auto',
        background: 'var(--ml-bg)',
      }}>
        {/* Sidebar only in grid view */}
        {view === 'grid' && (
          <>
            <div className={`sidebar-desktop${sidebarOpen ? ' open' : ''}`} style={{ display: 'flex' }}>
              <Sidebar
                filters={filters}
                setFilters={setFilters}
                onFilter={handleFilter}
                collapsed={!sidebarOpen}
                onToggleCollapse={() => setSidebarOpen(v => !v)}
              />
            </div>

            <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

            <button
              className="menu-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {sidebarOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                ) : (
                  <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                )}
              </svg>
            </button>
          </>
        )}

        {/* Grid view */}
        {view === 'grid' && (
          <main style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {ads.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center', color: 'var(--ml-text-tertiary)' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.4 }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ml-text-secondary)', marginBottom: '8px' }}>
                  {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum anúncio publicado'}
                </h3>
                <p style={{ fontSize: '14px', maxWidth: '300px' }}>
                  {searchQuery ? 'Tente buscar por um termo diferente ou limpe a busca.' : 'Crie seu primeiro anúncio em "Meus Anúncios".'}
                </p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '13px', color: 'var(--ml-text-tertiary)', marginBottom: '12px', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>
                    {ads.length} {ads.length === 1 ? 'resultado' : 'resultados'}
                    {searchQuery && <> para "<strong style={{ color: 'var(--ml-text-secondary)' }}>{searchQuery}</strong>"</>}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
                  {ads.map(ad => (
                    <ProductCard key={ad._id} ad={ad} />
                  ))}
                </div>
              </>
            )}
          </main>
        )}

        {/* My Ads page */}
        {view === 'my-ads' && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '32px 24px', background: 'var(--ml-yellow)', minHeight: '100%' }}>
            <div style={{ background: '#FFF', borderRadius: '12px', padding: '32px 40px', width: '100%', maxWidth: '920px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', alignSelf: 'flex-start' }}>
              <MyAdsPage onEdit={handleEditAd} onNew={() => { resetForm(); setView('form'); }} fetchAds={fetchAds} />
            </div>
          </div>
        )}

        {/* Form page */}
        {view === 'form' && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '32px 24px', background: 'var(--ml-yellow)', minHeight: '100%' }}>
            <div style={{ background: '#FFF', borderRadius: '12px', padding: '32px 40px', width: '100%', maxWidth: '660px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', alignSelf: 'flex-start' }}>
              <AdFormPage formData={formData} setFormData={setFormData} onSubmit={handleSubmit} onCancel={resetForm} onBack={() => setView('my-ads')} />
            </div>
          </div>
        )}
      </div>

      {syncData && (
        <SyncPanel
          divergences={syncData.divergences}
          checked={syncData.checked}
          onAccept={handleSyncAccept}
          onAcceptAll={handleSyncAcceptAll}
          onClose={() => { setSyncData(null); fetchAds(); }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
