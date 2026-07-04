# Research & Decisões Técnicas: 001-ml-security-reliability

Consolida as decisões que resolvem os pontos em aberto do Technical Context. Formato: Decisão / Justificativa / Alternativas.

## 1. Entrega do token de sessão ao frontend

- **Decisão**: Código de troca de uso único. O callback OAuth (`/api/auth/ml/callback`) redireciona ao frontend com `?code=<opaco>` (não o JWT). O frontend faz `POST /api/auth/exchange { code }` e recebe `{ token, userId, userName }` no corpo. O code tem TTL ~60s, é de uso único e é apagado após a troca.
- **Justificativa**: Frontend (`desafio-dev-two.vercel.app`) e backend (`desafio-dev-api.onrender.com`) estão em domínios de registro diferentes. Um cookie httpOnly seria *cookie de terceiros* — bloqueado por padrão no Safari (ITP) e em descontinuação no Chrome — o que quebraria o login para muitos usuários. O requisito é que **qualquer pessoa** consiga logar e anunciar. O exchange code mantém o token fora da URL/histórico (resolve FR-011) e funciona em qualquer navegador sem depender de cookies cross-site.
- **Alternativas consideradas**:
  - *Cookie httpOnly SameSite=None*: mais seguro contra XSS, mas cookie de terceiros → bloqueado por vários navegadores. Rejeitado pelo requisito de acesso universal.
  - *Token no fragmento `#`*: melhor que query string (o `#` não vai ao servidor nem a logs), mas ainda expõe o token à página imediatamente e depende de limpeza via `history.replaceState`. O exchange code é mais robusto e igualmente simples.
- **Nota de risco residual**: o JWT ainda será guardado no frontend (localStorage), portanto vulnerável a XSS. Mitigação: helmet/CSP no que for servido pelo backend, sanitização de conteúdo no frontend, e TTL de 7 dias no JWT. Migrar para cookie httpOnly só valeria a pena se front e back passassem a compartilhar domínio (fora de escopo).

## 2. Storage do estado OAuth e do exchange code

- **Decisão**: MongoDB com índice TTL. Dois models Mongoose:
  - `OAuthState`: `_id = state`, `codeVerifier`, `createdAt` → TTL ~300s.
  - `AuthCode`: `_id = code`, `userId`, `jwt` (ou dados p/ emitir o JWT), `createdAt` → TTL ~60s; documento removido na troca (uso único).
- **Justificativa**: Reaproveita o Atlas já conectado (zero infra/custo novo). O índice TTL do Mongo expira documentos automaticamente. Resolve FR-017 (login sobrevive a reinício/múltiplas instâncias) e FR-018 (state validável e não-reutilizável) porque o estado deixa de viver na memória de um processo.
- **Alternativas consideradas**:
  - *Map em memória (atual)*: quebra com reinício/hibernção do Render e com >1 instância. É a causa raiz do login intermitente. Rejeitado.
  - *Redis/KV externo*: TTL nativo e rápido, mas adiciona serviço a provisionar e pagar. Overkill para este volume.
  - *Cookie assinado (stateless)*: também cross-site (retorno do ML é top-level GET, SameSite=Lax funcionaria), mas mistura responsabilidades e é mais frágil de depurar. Mongo TTL é mais simples e observável.
- **Detalhe de implementação**: o índice TTL do Mongo varre ~1x/min, então a expiração pode atrasar até ~60s além do TTL nominal. Aceitável. A validação de idade/uso deve também ser checada em código no momento do consumo (não confiar só no TTL para segurança).

## 3. Fail-fast de variáveis de ambiente

- **Decisão**: Módulo `backend/src/config/env.js` que lê e valida env vars obrigatórias no boot. Em produção (`NODE_ENV=production`), ausência de `JWT_SECRET`, `ML_CLIENT_ID`, `ML_CLIENT_SECRET` ou `ML_REDIRECT_URI` → `process.exit(1)` com mensagem clara. Nunca usar o default `'dev-secret-change-in-production'` fora de dev.
- **Justificativa**: FR-014. Hoje o `JWT_SECRET` tem fallback inseguro que permitiria subir em produção com segredo previsível (forja de tokens).
- **Alternativas**: manter defaults só para dev com aviso ruidoso — mantido apenas para ambiente local, bloqueado em produção.

## 4. Resposta enxuta do `GET /api/auth/me`

- **Decisão**: Remover `_dump` e retornar apenas: `name`, `email`, `ml_user_id`, `ml_nickname`, `ml_seller`, `ml_can_sell`. Nada de perfil ML bruto, tags internas ou tokens.
- **Justificativa**: FR-012. O `_dump` hoje expõe o perfil ML inteiro (dados que não pertencem à UI).
- **Alternativas**: allowlist explícita de campos (adotada) vs. denylist (frágil, vaza campos novos por omissão). Allowlist escolhida.

## 5. Falha de refresh do token ML → re-login

- **Decisão**: `User.getValidToken()` lança um erro tipado (`class MlReauthRequired extends Error`) quando não há `refresh_token` ou quando o refresh retorna erro de credenciais. Um middleware/handler nas rotas converte esse erro em `401 { error, code: 'ML_REAUTH_REQUIRED' }`. O `api.js` do frontend, num interceptor de resposta, ao ver esse code limpa o storage e redireciona para `/`.
- **Justificativa**: FR-016 / SC-006. Hoje a falha vira erro genérico 500, confundindo o usuário.
- **Alternativas**: só retornar 401 genérico — insuficiente para o frontend distinguir "token app expirado" de "reautorização ML necessária". Código de erro dedicado escolhido.

## 6. Publicação de anúncio robusta e idempotente

- **Decisão**: No `POST /api/ads`:
  - Confirmar `ML_REDIRECT_URI` == cadastro do DevCenter (HTTPS, exatamente o path usado). Documentar no quickstart.
  - **Idempotência**: gerar um `idempotency_key` por submissão (enviado pelo frontend ou derivado de `seller_custom_field` já existente). Antes de recriar num retry, checar se já existe `Ad` com aquela key/`seller_custom_field` para não duplicar item no ML. O `createItem` NÃO deve ser reexecutado cegamente pelo `callWithRetry` se o erro for pós-criação.
  - **Upload atômico** (já é o comportamento): se qualquer imagem falhar, aborta antes de criar o item; mensagem indica qual imagem.
  - **Atributos**: manter resolução de `getCategoryRequiredAttributes` + `getCategorySaleTerms`; quando um valor obrigatório não puder ser inferido, retornar 400 pedindo o atributo ao usuário (em vez de erro cru do ML).
  - **Pré-validação**: manter `/items/validate` antes de `createItem`; traduzir erros de validação.
- **Justificativa**: FR-001..FR-007. A idempotência evita o pior efeito de retries (itens duplicados no marketplace).
- **Alternativas**: confiar no `callWithRetry` atual — arriscado, pois retry após timeout de resposta de criação pode duplicar item. Guard de idempotência escolhido.
- **Investigação pendente (na implementação)**: capturar o erro real que você está enfrentando ao publicar. O plano prevê instrumentar o `POST /ads` para logar `error.response.data` do ML de forma estruturada (sem vazar ao usuário) para diagnosticar a causa concreta na primeira execução com conta real.

## 7. mapMlError ampliado

- **Decisão**: Expandir `SELLER_ERROR_MAP` e a lógica de `mapMlError` para cobrir: cadastro de vendedor incompleto (address/identification/phone pending — já parcialmente coberto), categoria/listing type incompatível, atributos inválidos (`item.attributes.*`), imagens rejeitadas (`item.pictures.*`), preço/estoque inválidos. Retorno sempre em pt-BR, acionável, sem payload técnico.
- **Justificativa**: FR-008/FR-009 e US2.
- **Alternativas**: repassar `errData.message` do ML — frequentemente em espanhol/inglês e não acionável. Mapeamento curado escolhido, com fallback genérico seguro.

## 8. helmet, CORS e validação de entrada

- **Decisão**: Manter allowlist de origens explícita (já existe). Revisar helmet para incluir CSP adequada ao que o backend serve (a API não serve HTML, então CSP restritiva). Centralizar validação de entrada do `POST/PUT /ads` (título ≤60, preço>0, estoque≥1, ≤5 imagens) — já existe, consolidar mensagens.
- **Justificativa**: FR-019.
- **Alternativas**: adicionar biblioteca de validação (zod/joi) — opcional; para o escopo atual, validação manual consolidada basta.

## 9. Rotação de segredos (procedimento)

- **Decisão / procedimento**:
  - **JWT_SECRET**: gerar `openssl rand -hex 32`; atualizar no Render; efeito colateral desejado = todos deslogam (mitiga o vazamento). Nenhuma coordenação especial.
  - **ML_CLIENT_SECRET**: usar **"Programar renovação"** no DevCenter (não "Renove agora"). Isso mantém 2 secrets vigentes até a data de expiração — atualize o novo no Render **antes** da expiração do antigo, evitando janela de erro para novos logins. Só depois deixe o antigo expirar.
  - **MONGO_URI**: trocar a senha do usuário no Atlas; atualizar `MONGO_URI` no Render; restringir **IP Access List** (remover `0.0.0.0/0`; adicionar os egress IPs do Render ou, se indisponíveis no plano, restringir ao range documentado + monitorar).
  - **.env**: confirmar `.env` no `.gitignore`; `git log`/`git grep` para garantir que nenhum segredo foi commitado; se foi, considerar o histórico comprometido (reforça a necessidade de rotação).
- **Justificativa**: FR-013, e o vazamento ocorrido nesta sessão.
- **Alternativas**: "Renove agora" no ML — gera janela em que novos logins falham até o Render receber o novo secret. Rejeitado em favor da renovação programada.

## 10. Testes mínimos

- **Decisão**: Jest + Supertest. Cobrir:
  - `auth`: `/ml/login` gera state e persiste no Mongo; `/ml/callback` com state inválido é rejeitado; `/auth/exchange` troca code válido uma única vez (segunda tentativa falha); `/me` não retorna `_dump`.
  - `ads`: `POST /ads` com validações de entrada; mapeamento de erro do ML (com ML mockado via nock); guard de idempotência não duplica.
  - Usar `mongodb-memory-server` (já é dependência) para o banco de testes; mockar a API do ML (nock).
- **Roteiro manual E2E** (quickstart): com conta de teste de vendedor do ML, publicar um anúncio real e conferir no ML.
- **Justificativa**: sem suíte hoje; estes testes cobrem os caminhos de segurança e os pontos frágeis de publicação.

## 11. Webhooks de notificação (fora do MVP)

- **Decisão**: Registrar como fase futura. Configurar no DevCenter a "URL de retorno de notificações" apontando para um novo `POST /api/notifications/ml`; assinar o tópico **Items** (e opcionalmente Orders/Shipments). Ao receber notificação de mudança de item, atualizar o `Ad` local — substituindo o `POST /ads/sync` por polling.
- **Justificativa**: o guia do DevCenter descreve o mecanismo; reduz chamadas e mantém dados frescos. Não é necessário para o objetivo de segurança + publicação confiável.
- **Alternativas**: manter polling — aceitável no MVP.
