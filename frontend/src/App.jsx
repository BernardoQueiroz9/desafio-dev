import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import Sidebar from './components/Sidebar';

const unmaskPrice = (masked) => {
  if (!masked) return '';
  return parseFloat(masked.replace(/\./g, '').replace(',', '.'));
};

const toMaskedPrice = (num) => {
  if (num === null || num === undefined || num === '') return '';
  return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function Login() {
  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/login`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ml-yellow)',
      gap: '32px',
      padding: '20px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 700,
          color: '#333',
          letterSpacing: '-1px',
          marginBottom: '8px',
        }}>
          Desafio<span style={{ color: 'var(--ml-blue)' }}>ML</span>
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--ml-text-secondary)', marginTop: '8px' }}>
          Gerencie seus anúncios do Mercado Livre
        </p>
      </div>
      <button
        onClick={handleLogin}
        style={{
          background: 'var(--ml-blue)',
          color: '#fff',
          border: 'none',
          padding: '14px 40px',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(52,131,250,0.3)',
          transition: 'background 0.15s, transform 0.15s',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'var(--ml-blue-dark)';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'var(--ml-blue)';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        Conectar com Mercado Livre
      </button>
    </div>
  );
}

function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '' });
  const [formData, setFormData] = useState({
    id: null, title: '', price: '', available_quantity: '', image: ''
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      localStorage.setItem('userId', userId);
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    api.get('/ads').then(res => setAds(res.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedPrice = toMaskedPrice(formData.price);
      const payload = {
        ...formData,
        price: formattedPrice ? unmaskPrice(formattedPrice) : ''
      };
      if (formData.id) {
        await api.put(`/ads/${formData.id}`, payload);
      } else {
        await api.post('/ads', payload);
      }
      resetForm();
      fetchAds();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro na requisição');
    }
  };

  const resetForm = () => {
    setFormData({ id: null, title: '', price: '', available_quantity: '', image: '' });
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
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

  const filteredAds = searchQuery
    ? ads.filter(ad => ad.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : ads;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        onSearch={handleSearch}
        searchValue={searchQuery}
        onLogout={handleLogout}
      />

      <div style={{
        display: 'flex',
        flex: 1,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        background: 'var(--ml-bg)',
      }}>
        <div
          className={`sidebar-desktop${sidebarOpen ? ' open' : ''}`}
          style={{ display: 'flex' }}
        >
          <Sidebar
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            filters={filters}
            setFilters={setFilters}
            onFilter={handleFilter}
          />
        </div>

        <div
          className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <button
          className="menu-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </>
            )}
          </svg>
        </button>

        <main style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
        }}>
          {filteredAds.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              textAlign: 'center',
              color: 'var(--ml-text-tertiary)',
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.4 }}>
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ml-text-secondary)', marginBottom: '8px' }}>
                {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum anúncio publicado'}
              </h3>
              <p style={{ fontSize: '14px', maxWidth: '300px' }}>
                {searchQuery
                  ? `Tente buscar por um termo diferente ou limpe a busca.`
                  : 'Crie seu primeiro anúncio usando o formulário ao lado.'}
              </p>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: '13px',
                color: 'var(--ml-text-tertiary)',
                marginBottom: '12px',
                paddingLeft: '4px',
              }}>
                {filteredAds.length} {filteredAds.length === 1 ? 'resultado' : 'resultados'}
                {searchQuery && <> para "<strong style={{ color: 'var(--ml-text-secondary)' }}>{searchQuery}</strong>"</>}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '16px',
              }}>
                {filteredAds.map(ad => (
                  <ProductCard key={ad._id} ad={ad} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
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
