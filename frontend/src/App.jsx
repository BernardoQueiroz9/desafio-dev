import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api';

function Login() {
  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/login`;
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
      const res = await api.get('/ads', { params: filters });
      setAds(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/ads/${formData.id}`, formData);
        alert('Atualizado com sucesso!');
      } else {
        await api.post('/ads', formData);
        alert('Criado com sucesso!');
      }
      setFormData({ id: null, title: '', price: '', available_quantity: '' });
      fetchAds();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro na requisição');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => { localStorage.removeItem('userId'); navigate('/'); }}>Sair</button>
      
      <h2>{formData.id ? 'Editar Anúncio' : 'Novo Anúncio'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input required placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
        <input required type="number" placeholder="Preço" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
        <input required type="number" placeholder="Estoque" value={formData.available_quantity} onChange={e => setFormData({...formData, available_quantity: e.target.value})} />
        <button type="submit">{formData.id ? 'Atualizar' : 'Salvar'}</button>
        {formData.id && <button type="button" onClick={() => setFormData({ id: null, title: '', price: '', available_quantity: '' })}>Cancelar Edição</button>}
      </form>

      <h2>Meus Anúncios</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input type="number" placeholder="Preço Mín" value={filters.minPrice} onChange={e => setFilters({...filters, minPrice: e.target.value})} />
        <input type="number" placeholder="Preço Máx" value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice: e.target.value})} />
        <button onClick={fetchAds}>Filtrar</button>
      </div>

      <table border="1" width="100%" cellPadding="10" style={{ borderCollapse: 'collapse' }}>
        <thead><tr><th>ID (ML)</th><th>Título</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr></thead>
        <tbody>
          {ads.map(ad => (
            <tr key={ad._id}>
              <td>{ad.ml_id}</td><td>{ad.title}</td><td>R$ {ad.price}</td><td>{ad.available_quantity}</td>
              <td><button onClick={() => setFormData({ id: ad._id, title: ad.title, price: ad.price, available_quantity: ad.available_quantity })}>Editar</button></td>
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