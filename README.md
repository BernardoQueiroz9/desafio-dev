# Desafio ML — Gerenciamento de Anúncios

Sistema full-stack para criação, listagem, edição e sincronização de anúncios no Mercado Livre.

## Links de produção

- **Frontend:** https://desafio-dev-two.vercel.app
- **Backend:** https://desafio-dev-api.onrender.com/api

## Tecnologias

- **Frontend:** React (Vite), JavaScript, CSS
- **Backend:** Node.js, Express, MongoDB (Atlas / mongodb-memory-server)
- **Autenticação:** OAuth 2.0 via Mercado Livre + JWT
- **Deploy:** Vercel (frontend), Render (backend)

## Pré-requisitos

1. Node.js 18+
2. Conta de desenvolvedor no Mercado Livre

## Configuração do Mercado Livre

1. Acesse o [DevCenter do Mercado Livre](https://developers.mercadolivre.com.br/devcenter/)
2. Crie uma nova aplicação com:
   - **Nome:** DesafioML
   - **Redirect URI:**
     - `https://desafio-dev-api.onrender.com/api/auth/ml/callback`
   - **Scopes:** Leitura, Escrita, Offline Access
3. Anote o **Client ID** e **Client Secret**

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Descrição | Padrão |
|---|---|---|
| `PORT` | Porta do servidor | `3000` |
| `MONGO_URI` | String de conexão MongoDB Atlas | (usa mongodb-memory-server) |
| `FRONTEND_URL` | Origem permitida no CORS | `http://localhost:5173` |
| `BACKEND_URL` | URL base do próprio backend | `http://localhost:3000` |
| `ML_CLIENT_ID` | Client ID da aplicação no Mercado Livre | (obrigatório) |
| `ML_CLIENT_SECRET` | Secret Key da aplicação no Mercado Livre | (obrigatório) |
| `ML_REDIRECT_URI` | URL de callback do OAuth | `http://localhost:3000/api/auth/ml/callback` |
| `ML_SITE_ID` | Site do Mercado Livre (MLB = Brasil) | `MLB` |
| `JWT_SECRET` | Chave secreta para tokens JWT | (obrigatório) |

### Frontend (`frontend/.env`)

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_API_URL` | URL base da API | `http://localhost:3000/api` |

## Como rodar localmente

```bash
# Clone o repositorio
git clone https://github.com/BernardoQueiroz9/desafio-dev.git
cd desafio-dev

# Backend
cd backend
npm install
# Crie o arquivo backend/.env com as variaveis acima
npm start

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

O frontend estará em `http://localhost:5173` e o backend em `http://localhost:3000`.

## Fluxo de autenticação

1. O usuario clica em "Entrar com Mercado Livre" na tela de login
2. E redirecionado para o Mercado Livre para autorizar o aplicativo
3. Apos autorizar, e redirecionado de volta para a aplicacao
4. O backend troca o codigo de autorizacao por um access token
5. Um token JWT e gerado e armazenado no frontend para as requisicoes

## Funcionalidades

- Autenticacao via OAuth do Mercado Livre
- CRUD de anuncios (criar, listar, editar, excluir) com publicacao direta no ML
- Upload de imagem com drag-and-drop e compressao client-side
- Seletor hierarquico de categorias do Mercado Livre
- Busca por titulo com filtro de preco
- Grade de produtos com "Anunciado por: nome do vendedor"
- Pagina "Meus Anuncios" com edicao e exclusao
- Sincronizacao com marketplace (deteccao de divergencias)

## Estrutura do projeto

```
desafio-dev/
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose schemas (User, Ad)
│   │   ├── routes/          # Express routes (auth, ads, categories)
│   │   ├── services/        # Integracao com API do Mercado Livre
│   │   └── server.js        # Configuracao do servidor
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── api.js           # Axios instance com JWT
│   │   ├── App.jsx          # Rotas e logica principal
│   │   └── main.jsx         # Entry point
│   └── package.json
└── README.md
```
