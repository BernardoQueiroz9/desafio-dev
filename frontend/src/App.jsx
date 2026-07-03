import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { api } from './api';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import Sidebar from './components/Sidebar';
import SyncPanel from './components/SyncPanel';
import AdFormPage from './components/AdFormPage';
import MyAdsPage from './components/MyAdsPage';
import ProductDetailPage from './components/ProductDetailPage';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorScreen from './components/ErrorScreen';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const unmaskPrice = (masked) => {
  if (!masked) return '';
  return parseFloat(masked.replace(/\./g, '').replace(',', '.'));
};

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image" />
      <div className="skeleton-line short" style={{ marginTop: '12px' }} />
      <div className="skeleton-line" />
      <div className="skeleton-line medium" style={{ marginBottom: '12px' }} />
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userId = params.get('userId');
    const userName = params.get('userName');

    if (token && userId) {
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      if (userName) localStorage.setItem('userName', userName);
      navigate('/dashboard', { replace: true });
      return;
    }

    if (params.get('error')) {
      setError(decodeURIComponent(params.get('error')));
      navigate('/', { replace: true });
    }

    if (localStorage.getItem('token') && localStorage.getItem('userId')) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.search, navigate]);

  const handleLogin = () => {
    window.location.href = `${API_URL.replace('/api', '')}/api/auth/ml/login`;
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
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '28px' }}>
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
            Gerencie seus anúncios no Mercado Livre
          </p>
        </div>

        {error && (
          <p style={{ color: 'var(--ml-red)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
        )}

        <button
          onClick={handleLogin}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: '#FFF',
            color: '#333',
            border: '2px solid var(--ml-yellow)',
            padding: '14px 24px',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.target.style.borderColor = 'var(--ml-blue)'; e.target.style.background = '#F5F9FF'; }}
          onMouseLeave={(e) => { e.target.style.borderColor = 'var(--ml-yellow)'; e.target.style.background = '#FFF'; }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--ml-yellow)">
            <circle cx="12" cy="12" r="10" />
          </svg>
          Entrar com Mercado Livre
        </button>

        <p style={{ fontSize: '12px', color: 'var(--ml-text-tertiary)', marginTop: '20px' }}>
          Você será redirecionado para autorizar o acesso à sua conta do Mercado Livre.
        </p>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '' });
  const [formData, setFormData] = useState({
    id: null, title: '', price: '', available_quantity: '', image: '',
    description: '', free_shipping: false, is_full: false, category_id: ''
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncData, setSyncData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const abortRef = useRef(null);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const isEdit = pathParts[1] === 'editar' && pathParts[2];
  const editId = isEdit ? pathParts[2] : null;
  const isProduct = pathParts[1] === 'produto' && pathParts[2];
  let view = 'grid';
  if (pathParts[1] === 'meus-anuncios') view = 'my-ads';
  else if (pathParts[1] === 'novo-anuncio') view = 'form';
  else if (isEdit) view = 'form';
  else if (isProduct) view = 'product-detail';

  const userName = localStorage.getItem('userName') || 'Vendedor';

  const loadAds = (q, f) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setApiError(null);
    const params = {};
    const minP = f?.minPrice || filters.minPrice;
    const maxP = f?.maxPrice || filters.maxPrice;
    const query = q ?? searchQuery;
    if (minP) params.minPrice = unmaskPrice(minP);
    if (maxP) params.maxPrice = unmaskPrice(maxP);
    if (query) params.search = query;
    api.get('/ads', { params, signal: controller.signal })
      .then(res => { setAds(res.data); setLoading(false); })
      .catch(err => {
        if (err.name !== 'CanceledError') {
          setApiError('Não foi possível carregar os anúncios. Verifique sua conexão.');
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    loadAds();
  }, []);

  useEffect(() => {
    if (view !== 'form') return;
    if (editId) {
      const stateAd = location.state?.ad;
      if (stateAd && stateAd._id === editId) {
        setFormData({
          id: stateAd._id,
          title: stateAd.title || '',
          price: formatPrice(stateAd.price),
          available_quantity: stateAd.available_quantity ?? '',
          image: stateAd.image || '',
          description: stateAd.description || '',
          free_shipping: stateAd.free_shipping || false,
          is_full: stateAd.is_full || false,
          category_id: stateAd.category_id || '',
        });
      } else {
        api.get(`/ads/${editId}`).then(ad => {
          setFormData({
            id: ad.data._id,
            title: ad.data.title || '',
            price: formatPrice(ad.data.price),
            available_quantity: ad.data.available_quantity ?? '',
            image: ad.data.image || '',
            description: ad.data.description || '',
            free_shipping: ad.data.free_shipping || false,
            is_full: ad.data.is_full || false,
            category_id: ad.data.category_id || '',
          });
        }).catch(console.error);
      }
    } else {
      setFormData({ id: null, title: '', price: '', available_quantity: '', image: '', description: '', free_shipping: false, is_full: false, category_id: '' });
    }
  }, [view, editId]);

  const formatPrice = (v) => {
    if (v == null || v === '') return '';
    return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchAds = (f, q) => {
    loadAds(q, f);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/ads/sync');
      setSyncData(res.data);
    } catch {
      setApiError('Erro ao sincronizar com o Mercado Livre. Verifique sua conexão.');
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
      navigate('/dashboard/meus-anuncios');
      fetchAds();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro na requisição';
      console.error('Submit error:', err);
      setApiError(msg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    navigate('/');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (view !== 'grid') navigate('/dashboard');
    fetchAds(filters, query);
  };

  const handleFilter = (overrideFilters) => {
    const f = overrideFilters || filters;
    fetchAds(f, searchQuery);
    setSidebarOpen(false);
  };

  const handleEditAd = (ad) => {
    navigate(`/dashboard/editar/${ad._id}`, { state: { ad } });
  };

  const hasDivergences = syncData && syncData.divergences.length > 0;

  let navTarget = null;
  let navLabel = null;
  if (view === 'grid') { navTarget = '/dashboard/meus-anuncios'; navLabel = 'Meus Anuncios'; }
  else if (view === 'product-detail') { navTarget = '/dashboard'; navLabel = 'Voltar'; }
  else if (view === 'my-ads') { navTarget = '/dashboard'; navLabel = 'Voltar'; }
  else if (view === 'form' && editId) { navTarget = '/dashboard/meus-anuncios'; navLabel = 'Voltar'; }
  else if (view === 'form' && !editId) { navTarget = '/dashboard'; navLabel = 'Voltar'; }

  const skeletonGrid = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}
      className="product-grid">
      {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        onSearch={handleSearch}
        searchValue={searchQuery}
        onLogout={handleLogout}
        userName={userName}
        navTarget={navTarget}
        navLabel={navLabel}
      />

      <div style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        background: 'var(--ml-bg)',
      }}>
        {(view === 'grid' || view === 'product-detail') && (
          <>
            <div className={`sidebar-desktop${sidebarOpen ? ' open' : ''}`}>
              <Sidebar
                filters={filters}
                setFilters={setFilters}
                onFilter={handleFilter}
                collapsed={!sidebarOpen}
                onToggleCollapse={() => setSidebarOpen(v => !v)}
                currentView={view}
                onNavigate={navigate}
                onLogout={handleLogout}
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

        {view === 'grid' && (
          <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }} className="page-enter">
            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
              {apiError && !loading ? (
                <ErrorScreen message={apiError} onRetry={() => loadAds()} />
              ) : loading ? skeletonGrid : (
                ads.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center', color: 'var(--ml-text-tertiary)' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.4 }}>
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ml-text-secondary)', marginBottom: '8px' }}>
                      {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum anuncio publicado'}
                    </h3>
                    <p style={{ fontSize: '14px', maxWidth: '300px' }}>
                      {searchQuery ? 'Tente buscar por um termo diferente ou limpe a busca.' : 'Crie seu primeiro anuncio em "Meus Anuncios".'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '13px', color: 'var(--ml-text-tertiary)', marginBottom: '12px', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>
                        {ads.length} {ads.length === 1 ? 'resultado' : 'resultados'}
                        {searchQuery && <> para &quot;<strong style={{ color: 'var(--ml-text-secondary)' }}>{searchQuery}</strong>&quot;</>}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}
                      className="product-grid">
                      {ads.map(ad => (
                        <ProductCard key={ad._id} ad={ad} />
                      ))}
                    </div>
                  </>
                )
              )}
            </div>
          </main>
        )}

        {view === 'my-ads' && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '32px 24px', background: 'var(--ml-yellow)', minHeight: '100%' }}>
            <div className="myads-card" style={{ background: '#FFF', borderRadius: '12px', padding: '32px 40px', width: '100%', maxWidth: '920px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', alignSelf: 'flex-start' }}>
              <MyAdsPage onEdit={handleEditAd} onNew={() => {
                setFormData({ id: null, title: '', price: '', available_quantity: '', image: '', description: '', free_shipping: false, is_full: false, category_id: '' });
                navigate('/dashboard/novo-anuncio');
              }} fetchAds={fetchAds} />
            </div>
          </div>
        )}

        {view === 'form' && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '32px 24px', background: 'var(--ml-yellow)', minHeight: '100%' }}>
            <div className="form-card" style={{ background: '#FFF', borderRadius: '12px', padding: '32px 40px', width: '100%', maxWidth: '660px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', alignSelf: 'flex-start' }}>
              <AdFormPage key={editId || 'new'}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setFormData({ id: null, title: '', price: '', available_quantity: '', image: '', description: '', free_shipping: false, is_full: false, category_id: '' });
                  navigate('/dashboard/meus-anuncios');
                }}
              />
            </div>
          </div>
        )}

        {view === 'product-detail' && (
          <ProductDetailPage />
        )}
      </div>

      {syncData && (
        <SyncPanel
          divergences={syncData.divergences}
          failed={syncData.failed}
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
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
