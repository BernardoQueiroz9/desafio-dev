# Contrato: Rotas de Autenticação

Base: `/api/auth`. Alterações em relação ao comportamento atual estão marcadas com **[MUDANÇA]**.

## GET /api/auth/ml/login

Inicia o fluxo OAuth.

- **Efeito**: gera `state` + `code_verifier` (PKCE S256); persiste em `OAuthState` (Mongo TTL) **[MUDANÇA: era Map em memória]**; redireciona para a URL de autorização do ML.
- **Resposta**: `302` → `https://auth.mercadolivre.com.br/authorization?...`
- **Segurança**: `code_challenge_method=S256`; `state` aleatório de 128 bits.

## GET /api/auth/ml/callback

Recebe o retorno do ML.

- **Query**: `code`, `state`, `error?`
- **Fluxo**:
  1. `OAuthState.findOneAndDelete({ _id: state })`. Ausente/expirado → `302 FRONTEND/?error=invalid_state`.
  2. Se `error` ou sem `code` → `302 FRONTEND/?error=<...>`.
  3. Troca `code` por tokens ML (com `code_verifier`).
  4. Upsert do `User` com tokens ML.
  5. Gera `authCode` opaco; cria `AuthCode` (Mongo TTL ~60s).
  6. **[MUDANÇA]** `302 FRONTEND/?code=<authCode>` — **sem** `token`/`userId`/`userName` na URL.
- **Antes (removido)**: `302 FRONTEND/?token=<JWT>&userId=...&userName=...` — vazava o JWT na URL/histórico.

## POST /api/auth/exchange **[NOVO]**

Troca o code de uso único pelo JWT.

- **Body**: `{ "code": "<authCode>" }`
- **Fluxo**:
  1. `AuthCode.findOneAndDelete({ _id: code })`. Ausente/expirado/já usado → `410 { error: "Código expirado ou já utilizado. Faça login novamente." }`.
  2. Assina o JWT (`{ userId, mlUserId }`, `expiresIn: '7d'`).
  3. Responde `200 { token, userId, userName }`.
- **Segurança**: uso único garantido pelo delete atômico; TTL curto; code opaco não adivinhável.
- **Erros**: `400` body inválido; `410` code inválido/expirado.

## GET /api/auth/me

Perfil do usuário autenticado.

- **Auth**: `Authorization: Bearer <JWT>`
- **[MUDANÇA]** Resposta enxuta (allowlist), **sem `_dump`**:

```json
{
  "name": "string",
  "email": "string",
  "ml_user_id": "string",
  "ml_nickname": "string|null",
  "ml_seller": true,
  "ml_can_sell": true
}
```

- **Removido**: `_dump` (perfil ML bruto), `ml_tags`, `ml_mercadoenvios`, `ml_seller_experience` cru — a menos que a UI precise; incluir apenas o que for usado.
- **Erros**: `401` sem/inválido token; `404` usuário não encontrado.

## Erro de reautorização ML **[NOVO padrão transversal]**

Quando `User.getValidToken()` lança `MlReauthRequired` (refresh impossível/inválido), qualquer rota autenticada responde:

```json
// 401
{ "error": "Sua sessão com o Mercado Livre expirou. Entre novamente.", "code": "ML_REAUTH_REQUIRED" }
```

O frontend (`api.js`, interceptor de resposta) detecta `code === 'ML_REAUTH_REQUIRED'`, limpa o storage e redireciona para `/`.
