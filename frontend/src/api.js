import axios from 'axios';

const PROD_API_URL = 'https://desafio-dev-api.onrender.com/api';
const DEV_API_URL = 'http://localhost:3000/api';

export function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return PROD_API_URL;
  }
  return DEV_API_URL;
}

export const api = axios.create({
  baseURL: getApiUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Qualquer 401 significa sessao invalida (token do app expirado/invalido, ou
// reautorizacao do ML necessaria). Limpamos o storage e voltamos ao login,
// evitando que o dashboard fique preso mostrando "nao foi possivel carregar".
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      if (window.location.pathname !== '/') {
        // Registra o motivo para a tela de login exibir (evita "voltar ao login" silencioso).
        const code = err.response?.data?.code;
        const reason = code === 'ML_REAUTH_REQUIRED'
          ? 'Sua sessão com o Mercado Livre expirou. Entre novamente.'
          : `Sua sessão expirou (401 em ${err.config?.url || 'requisição'}). Entre novamente.`;
        try { sessionStorage.setItem('authError', reason); } catch {}
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);
