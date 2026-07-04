# Data Model: 001-ml-security-reliability

Entidades afetadas e novas. Alterações mínimas; foco nos requisitos de segurança/confiabilidade.

## Entidades existentes (ajustes)

### User (`backend/src/models/User.js`)

Sem mudança de schema. Mudança de comportamento em `getValidToken()`:

- Continua fazendo refresh automático quando o token ML expira.
- **Novo**: quando não há `refresh_token`, ou o refresh retorna erro de credencial/autorização, lança `MlReauthRequired` (erro tipado) em vez de `Error` genérico.
- Campos sensíveis (`ml_access_token`, `ml_refresh_token`) **nunca** devem ser serializados em respostas — garantir via `.select()` nas queries e/ou `toJSON` transform que os remove.

### Ad (`backend/src/models/Ad.js`)

Adição opcional para idempotência:

| Campo | Tipo | Regra |
|---|---|---|
| `idempotency_key` | String | Opcional, único-esparso. Preenchido na criação para evitar item duplicado no ML em caso de retry. Pode reutilizar/derivar do `seller_custom_field` já existente (`app_<userId>_<ts>`). |

Índice: `{ idempotency_key: 1 }` unique sparse. Demais campos inalterados.

## Entidades novas (storage OAuth com TTL)

### OAuthState (`backend/src/models/OAuthState.js`)

Substitui o `stateStore` (Map em memória) de `routes/auth.js`.

| Campo | Tipo | Regra |
|---|---|---|
| `_id` | String | O próprio `state` (32 hex). Chave primária → lookup direto. |
| `codeVerifier` | String | Verificador PKCE gerado no `/ml/login`. |
| `createdAt` | Date | `default: Date.now`. Índice TTL. |

- **Índice TTL**: `createdAt` com `expireAfterSeconds: 300` (~5 min, alinhado ao `STATE_TTL` atual).
- **Uso único**: no `/ml/callback`, ler e **deletar** o documento (`findOneAndDelete`) antes de trocar o code. State ausente/expirado → rejeitar login.

### AuthCode (`backend/src/models/AuthCode.js`)

Suporta o fluxo de exchange code de uso único.

| Campo | Tipo | Regra |
|---|---|---|
| `_id` | String | O `code` opaco (ex.: 32 bytes base64url). Chave primária. |
| `userId` | ObjectId (ref User) | Usuário autenticado a quem o code pertence. |
| `token` | String | JWT já assinado a ser entregue na troca. (Alternativa: guardar só `userId`/`mlUserId` e assinar o JWT no exchange — preferível para não persistir o JWT; ver contrato.) |
| `userName` | String | Nome para a UI. |
| `createdAt` | Date | `default: Date.now`. Índice TTL. |

- **Índice TTL**: `createdAt` com `expireAfterSeconds: 60` (~1 min).
- **Uso único**: no `POST /auth/exchange`, `findOneAndDelete` pelo code; ausente/expirado → 400/410.
- **Preferência de segurança**: armazenar dados mínimos (`userId`, `mlUserId`, `userName`) e **assinar o JWT no momento da troca**, para não deixar um JWT válido persistido no banco durante ~60s.

## Ciclo de vida do fluxo OAuth (com as novas entidades)

```text
1. GET /api/auth/ml/login
   - gera state + codeVerifier (PKCE)
   - cria OAuthState{ _id: state, codeVerifier }
   - redirect -> ML authorization (state + code_challenge S256)

2. ML -> GET /api/auth/ml/callback?code&state
   - OAuthState.findOneAndDelete({ _id: state })  (ausente => rejeita)
   - exchangeCode(code, redirectUri, codeVerifier)  -> tokens ML
   - upsert User com tokens ML
   - gera authCode opaco
   - cria AuthCode{ _id: authCode, userId, mlUserId, userName }
   - redirect -> FRONTEND/?code=<authCode>   (SEM jwt na URL)

3. Frontend: POST /api/auth/exchange { code }
   - AuthCode.findOneAndDelete({ _id: code })  (ausente/expirado => 410)
   - assina JWT (7d) a partir de userId/mlUserId
   - responde { token, userId, userName }
   - frontend guarda token e navega para /dashboard
```

## Regras de retenção / segurança de dados

- `OAuthState` e `AuthCode` são efêmeros; TTL garante limpeza automática mesmo sem consumo.
- Tokens ML (`User`) são sensíveis: acesso restrito, nunca em respostas, nunca logados.
- Nenhum segredo (JWT_SECRET, client secret, senha do Mongo) reside no código ou no repositório — apenas em variáveis de ambiente do Render/Vercel.
