import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api';

function Login() {
  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/login`;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Desafio Mercado Livre</h1>
      <button onClick={handleLogin} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Conectar com Mercado Livre
      </button>
    </div>
  );
}

const formatPrice = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/[^\d,.]/g, '');
  const noThousandSep = cleaned.replace(/\.(\d{3})/g, '$1');
  const normalized = noThousandSep.replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const unmaskPrice = (masked) => {
  if (!masked) return '';
  return parseFloat(masked.replace(/\./g, '').replace(',', '.'));
};

const toMaskedPrice = (num) => {
  if (num === null || num === undefined || num === '') return '';
  return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '' });
  const [formData, setFormData] = useState({ id: null, title: '', price: '', available_quantity: '' });

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      localStorage.setItem('userId', userId);
      navigate('/dashboard', { replace: true });
    }
    fetchAds();
  }, [searchParams]);

  const fetchAds = async () => {
    try {
      const params = {};
      if (filters.minPrice) params.minPrice = unmaskPrice(formatPrice(filters.minPrice));
      if (filters.maxPrice) params.maxPrice = unmaskPrice(formatPrice(filters.maxPrice));
      const res = await api.get('/ads', { params });
      setAds(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedPrice = formatPrice(formData.price);
      const payload = {
        ...formData,
        price: formattedPrice ? unmaskPrice(formattedPrice) : ''
      };
      if (formData.id) {
        await api.put(`/ads/${formData.id}`, payload);
        alert('Atualizado com sucesso!');
      } else {
        await api.post('/ads', payload);
        alert('Criado com sucesso!');
      }
      setFormData({ id: null, title: '', price: '', available_quantity: '' });
      fetchAds();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro na requisição');
    }
  };

  const handlePriceFocus = () => {
    setFormData(prev => ({ ...prev, price: prev.price.replace(/\./g, '') }));
  };

  const handlePriceBlur = () => {
    setFormData(prev => ({ ...prev, price: prev.price ? formatPrice(prev.price) : '' }));
  };

  const handlePriceChange = (e) => {
    const cleaned = e.target.value.replace(/[^\d,.]/g, '');
    setFormData(prev => ({ ...prev, price: cleaned }));
  };

  const handleMinPriceFocus = () => {
    setFilters(prev => ({ ...prev, minPrice: prev.minPrice.replace(/\./g, '') }));
  };

  const handleMinPriceBlur = () => {
    setFilters(prev => ({ ...prev, minPrice: prev.minPrice ? formatPrice(prev.minPrice) : '' }));
  };

  const handleMaxPriceFocus = () => {
    setFilters(prev => ({ ...prev, maxPrice: prev.maxPrice.replace(/\./g, '') }));
  };

  const handleMaxPriceBlur = () => {
    setFilters(prev => ({ ...prev, maxPrice: prev.maxPrice ? formatPrice(prev.maxPrice) : '' }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => { localStorage.removeItem('userId'); navigate('/'); }}>Sair</button>
      
      <h2>{formData.id ? 'Editar Anúncio' : 'Novo Anúncio'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input required placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
        <input required placeholder="Preço" value={formData.price} onFocus={handlePriceFocus} onBlur={handlePriceBlur} onChange={handlePriceChange} />
        <input required type="number" placeholder="Estoque" value={formData.available_quantity} onChange={e => setFormData({...formData, available_quantity: e.target.value})} />
        <button type="submit">{formData.id ? 'Atualizar' : 'Salvar'}</button>
        {formData.id && <button type="button" onClick={() => setFormData({ id: null, title: '', price: '', available_quantity: '' })}>Cancelar Edição</button>}
      </form>

      <h2>Meus Anúncios</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input placeholder="Preço Mín" value={filters.minPrice} onFocus={handleMinPriceFocus} onBlur={handleMinPriceBlur} onChange={e => setFilters({...filters, minPrice: e.target.value.replace(/[^\d,.]/g, '')})} />
        <input placeholder="Preço Máx" value={filters.maxPrice} onFocus={handleMaxPriceFocus} onBlur={handleMaxPriceBlur} onChange={e => setFilters({...filters, maxPrice: e.target.value.replace(/[^\d,.]/g, '')})} />
        <button onClick={fetchAds}>Filtrar</button>
      </div>

      <table border="1" width="100%" cellPadding="10" style={{ borderCollapse: 'collapse' }}>
        <thead><tr><th>ID (ML)</th><th>Título</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr></thead>
        <tbody>
          {ads.map(ad => (
            <tr key={ad._id}>
              <td>{ad.ml_id}</td><td>{ad.title}</td><td>R$ {toMaskedPrice(ad.price)}</td><td>{ad.available_quantity}</td>
              <td><button onClick={() => setFormData({ id: ad._id, title: ad.title, price: toMaskedPrice(ad.price), available_quantity: ad.available_quantity })}>Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
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