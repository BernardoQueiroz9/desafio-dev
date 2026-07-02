# Desafio ML — Gerenciamento de Anúncios

Sistema full-stack para criação, listagem, edição e sincronização de anúncios, inspirado no Mercado Livre.

> **Nota:** A integração com a API real do Mercado Livre foi substituída por rotas simuladas (`/mock/items`), pois a conta de desenvolvedor foi suspensa ao tentar autenticar no Mercado Livre Developers. Todo o fluxo de criação, edição e sincronização funciona com dados mockados.

## Links de produção

- **Frontend:** https://desafio-dev-two.vercel.app
- **Backend:** https://desafio-dev-api.onrender.com/api

## Tecnologias

- **Frontend:** React (Vite), JavaScript, CSS
- **Backend:** Node.js, Express, MongoDB (Atlas / mongodb-memory-server)
- **Deploy:** Vercel (frontend), Render (backend)

## Como rodar localmente

Pré-requisito: Node.js 18+

```bash
# Clone o repositório
git clone https://github.com/BernardoQueiroz9/desafio-dev.git
cd desafio-dev

# Backend
cd backend
npm install
# (opcional) Crie um arquivo .env com MONGO_URI para usar Atlas;
# Sem MONGO_URI, o banco em memória (mongodb-memory-server) é usado automaticamente
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

O frontend estará em `http://localhost:5173` e o backend em `http://localhost:3000`.

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Descrição | Padrão |
|---|---|---|
| `PORT` | Porta do servidor | `3000` |
| `MONGO_URI` | String de conexão MongoDB Atlas | (usa mongodb-memory-server) |
| `FRONTEND_URL` | Origem permitida no CORS | `http://localhost:5173` |
| `BACKEND_URL` | URL base do próprio backend | `http://localhost:3000` |
| `SMTP_HOST` | Servidor SMTP (ex: smtp.gmail.com) | — |
| `SMTP_PORT` | Porta SMTP | `587` |
| `SMTP_USER` | Email do remetente | — |
| `SMTP_PASS` | Senha de app ou senha SMTP | — |

> Por padrão, utiliza o serviço **Ethereal** (SMTP fake) — os emails são capturados e podem ser visualizados pelo link exibido no console do backend. Para enviar emails reais, configure as variáveis SMTP com os dados do seu provedor (ex: Gmail com senha de app em https://myaccount.google.com/apppasswords).

### Frontend (`frontend/.env`)

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_API_URL` | URL base da API | `http://localhost:3000/api` |

## Funcionalidades

- Autenticação de vendedor (cadastro/login com email e senha)
- CRUD de anúncios (criar, listar, editar, excluir)
- Upload de imagem com drag-and-drop e compressão client-side
- Busca por título com filtro de preço (slider + campos manuais)
- Grade de produtos com "Anunciado por: nome do vendedor"
- Página "Meus Anúncios" com edição e exclusão
- Sincronização com marketplace simulado (detecção de divergências)
- Sidebar colapsável
- "Lembrar de mim" no login
- Notificação de login por email (via SMTP — Gmail, Outlook etc.)

## Estrutura do projeto

```
desafio-dev/
├── backend/
│   ├── src/
│   │   ├── models/        # Mongoose schemas (User, Ad)
│   │   ├── routes/        # Express routes (auth, ads, mock)
│   │   └── server.js      # Configuração do servidor
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── api.js         # Axios instance
│   │   ├── App.jsx        # Rotas e lógica principal
│   │   └── main.jsx       # Entry point
│   └── package.json
└── README.md
```
