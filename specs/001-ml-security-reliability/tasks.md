# Tasks: Segurança e Confiabilidade na Publicação de Anúncios no Mercado Livre

**Input**: Design documents from `specs/001-ml-security-reliability/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth.md, contracts/ads.md, quickstart.md

**Tests**: Incluídos (Fase 6) — o usuário pediu explicitamente testes de integração + roteiro E2E. Não é TDD estrito; testes vêm após a implementação de cada fluxo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 (publicar anúncio), US2 (mensagens de erro), US3 (sessão/credenciais), US4 (auth estável)
- Caminhos de arquivo são relativos à raiz do repositório.

## Path Conventions

- Backend: `backend/src/...`, testes em `backend/tests/...`
- Frontend: `frontend/src/...`

---

## Phase 0: Contenção de Segurança (P0) — ✅ CONCLUÍDA (fora do código)

**Purpose**: Ações operacionais em painéis externos, já executadas pelo usuário. Registradas para contexto/auditoria. Ref: FR-013, FR-015, V7.

- [x] T000 Rotacionar `JWT_SECRET` no Render (novo valor aleatório de 256 bits)
- [x] T000a Rotacionar `ML_CLIENT_SECRET` no DevCenter (via "Programar renovação") e atualizar no Render
- [x] T000b Trocar a senha do usuário do MongoDB Atlas e atualizar `MONGO_URI` no Render
- [x] T000c Revisar Network Access do Atlas e privilégios mínimos do usuário do banco
- [x] T000d Confirmar `.env` no `.gitignore` e histórico do git limpo (verificado: 104 commits, 0 segredos)

**Checkpoint**: Segredos rotacionados. O código abaixo assume que nenhum segredo vive no repositório.

---

## Phase 1: Setup (Infraestrutura compartilhada)

**Purpose**: Dependências e estrutura para o trabalho das fases seguintes.

- [ ] T001 [P] Adicionar dependências de dev de teste ao `backend/package.json`: `jest`, `supertest`, `nock` (e script `"test": "jest"`)
- [ ] T002 [P] Criar a pasta `backend/tests/` com um `backend/tests/setup.js` que sobe `mongodb-memory-server` e conecta o mongoose antes dos testes (reaproveitar padrão do `server.js`)
- [ ] T003 [P] Adicionar `frontend/.env.example` já contém `VITE_API_URL`; confirmar e documentar no `README.md` a variável `NODE_ENV` esperada em produção no backend

**Checkpoint**: Ambiente de testes disponível; sem mudança de comportamento em produção ainda.

---

## Phase 2: Foundational (Pré-requisitos bloqueantes)

**Purpose**: Infra central que TODAS as histórias dependem: validação de env e os models de estado do OAuth. ⚠️ Nenhuma história pode ser concluída antes desta fase.

- [ ] T004 Criar `backend/src/config/env.js` com fail-fast: em `NODE_ENV=production`, abortar (`process.exit(1)`) com mensagem clara se faltar `JWT_SECRET`, `ML_CLIENT_ID`, `ML_CLIENT_SECRET` ou `ML_REDIRECT_URI`; nunca usar o default `'dev-secret-change-in-production'` fora de dev. Exportar os valores validados. (FR-014, V5)
- [ ] T005 Integrar `config/env.js` no boot: `backend/src/server.js` importa e valida antes de `app.listen`; `routes/auth.js` passa a consumir `JWT_SECRET` do módulo em vez do fallback inline. (FR-014)
- [ ] T006 [P] Criar model `backend/src/models/OAuthState.js`: `_id: String (state)`, `codeVerifier: String`, `createdAt: Date` com índice TTL `expireAfterSeconds: 300`. (FR-017, FR-018, data-model.md)
- [ ] T007 [P] Criar model `backend/src/models/AuthCode.js`: `_id: String (code)`, `userId`, `mlUserId`, `userName`, `createdAt: Date` com índice TTL `expireAfterSeconds: 60`. (FR-011, data-model.md)
- [ ] T008 Remover do `backend/src/server.js` o bloco legado `dropIndex('email_1')` (resquício não mais necessário) e revisar a config do `helmet()` (CSP restritiva, já que a API não serve HTML) e da allowlist de CORS. (FR-019)

**Checkpoint**: Env validado no boot; models de estado do OAuth prontos com TTL.

---

## Phase 3: User Story 3 — Sessão e credenciais protegidas (Priority: P1) 🎯 MVP de segurança

**Goal**: Login e uso sem vazar token de sessão ou dados sensíveis; estado do OAuth resiliente; refresh que falha vira re-login limpo.

**Independent Test**: Login → token só trafega no corpo de `/auth/exchange` (V1); code é de uso único (V2); reinício do backend no meio do fluxo não quebra login (V3); `/me` sem `_dump` (V4); refresh inválido → 401 `ML_REAUTH_REQUIRED` e frontend redireciona (V6).

### Storage do OAuth no Mongo (substitui o Map em memória)

- [ ] T009 [US3] Em `backend/src/routes/auth.js`, remover o `stateStore` (Map) e o `setInterval` de limpeza; `GET /ml/login` passa a criar um doc `OAuthState` (state + codeVerifier) no Mongo. (FR-017)
- [ ] T010 [US3] Em `backend/src/routes/auth.js`, `GET /ml/callback` passa a `OAuthState.findOneAndDelete({ _id: state })`; state ausente/expirado → redirect `?error=invalid_state`. (FR-018, V3)

### Entrega de token via exchange code (sem JWT na URL)

- [ ] T011 [US3] Em `backend/src/routes/auth.js`, após upsert do usuário no callback, gerar um `code` opaco (`crypto.randomBytes(32).base64url`), criar `AuthCode` (userId, mlUserId, userName) e redirecionar para `FRONTEND/?code=<code>` — remover `token`/`userId`/`userName` da URL. (FR-011, V1, contracts/auth.md)
- [ ] T012 [US3] Adicionar `POST /api/auth/exchange` em `backend/src/routes/auth.js`: `AuthCode.findOneAndDelete({ _id: code })`; ausente/expirado → `410`; senão assinar o JWT (7d) a partir de userId/mlUserId e responder `{ token, userId, userName }`. (FR-011, V2, contracts/auth.md)
- [ ] T013 [US3] No frontend `frontend/src/App.jsx` (componente `Login`), ler `?code=` da URL, chamar `POST /auth/exchange`, salvar `token`/`userId`/`userName` no storage, limpar a URL (`replace`) e navegar para `/dashboard`; manter fallback de leitura de `?error=`. (FR-011, V1)

### /me enxuto

- [ ] T014 [P] [US3] Em `backend/src/routes/auth.js`, `GET /me` retorna allowlist `{ name, email, ml_user_id, ml_nickname, ml_seller, ml_can_sell }` — remover `_dump`, `ml_tags`, `ml_mercadoenvios`, `_dump` do perfil ML. (FR-012, V4)

### Refresh do token ML → re-login

- [ ] T015 [P] [US3] Criar erro tipado `MlReauthRequired` (ex.: `backend/src/services/errors.js`) e usá-lo em `backend/src/models/User.js#getValidToken`: sem `refresh_token` ou refresh com erro de credencial → lançar `MlReauthRequired`. (FR-016, data-model.md)
- [ ] T016 [US3] Em `backend/src/routes/auth.js`, `ads.js` e `categories.js`, tratar `MlReauthRequired` respondendo `401 { error, code: 'ML_REAUTH_REQUIRED' }` (helper compartilhado). (FR-016, contracts/auth.md)
- [ ] T017 [US3] No frontend `frontend/src/api.js`, adicionar interceptor de resposta: ao receber `401` com `code === 'ML_REAUTH_REQUIRED'`, limpar o storage e redirecionar para `/`. (FR-016, V6)

**Checkpoint**: US3 completa — nenhuma credencial/token vaza; login resiliente a reinício; refresh falho vira re-login.

---

## Phase 4: User Story 1 — Publicar um anúncio real no ML (Priority: P1) 🎯 MVP de produto

**Goal**: Publicação confiável e idempotente no Mercado Livre.

**Independent Test**: Publicar com conta de teste apta gera item real com `ml_id` (V8); retry com mesma `idempotency_key` não duplica (V9); imagem inválida aborta sem criar item (V10).

- [ ] T018 [US1] Conferir/documentar que `ML_REDIRECT_URI` do backend == cadastro do DevCenter (HTTPS, path exato `.../api/auth/ml/callback`); registrar no `quickstart.md`/`README.md` se houver divergência a corrigir no painel. (FR-004, quickstart pré-requisitos)
- [ ] T019 [P] [US1] Adicionar campo `idempotency_key` (String, índice unique sparse) ao `backend/src/models/Ad.js`. (FR-007, data-model.md)
- [ ] T020 [US1] Em `backend/src/routes/ads.js` `POST /`, aceitar `idempotency_key` do body (ou derivar do `seller_custom_field`); antes de criar, se já existir `Ad` do usuário com essa key, retornar o anúncio existente sem recriar no ML. (FR-007, V9)
- [ ] T021 [US1] Em `backend/src/routes/ads.js` `POST /`, garantir que `createItem` execute **uma única vez** — isolar a criação do `callWithRetry` genérico para não duplicar item após timeout pós-criação; o retry só cobre etapas seguras/idempotentes. (FR-007, research §6)
- [ ] T022 [US1] Revisar o upload atômico de imagens em `backend/src/routes/ads.js` (já aborta se alguma falhar): garantir mensagem indicando qual imagem falhou e nenhum item criado. (FR-002, V10)
- [ ] T022a [US1] Preservar o comportamento de FR-006 no `POST /ads` de `backend/src/routes/ads.js` durante a refatoração da Fase 4: se o item é criado mas `setDescription` falha, concluir a criação e retornar `description_warning` (não abortar o anúncio). (FR-006)
- [ ] T023 [US1] Revisar resolução de atributos obrigatórios + `sale_terms`/garantia em `backend/src/routes/ads.js` e `services/mercadolibre.js`: quando um valor obrigatório não for inferível, retornar `400` pedindo o atributo específico ao usuário em vez de deixar o ML recusar. (FR-003)
- [ ] T024 [US1] Manter/validar a checagem de `available_listing_types` (gold_special) antes de submeter e a chamada a `/items/validate` antes de `createItem` em `backend/src/routes/ads.js`. (FR-004, FR-005)
- [ ] T025 [US1] Instrumentar log estruturado do erro real do ML em `backend/src/routes/ads.js` (logar `error.response.status` + `error.response.data` de forma estruturada no servidor, sem vazar ao usuário) para diagnosticar a causa concreta da falha de publicação na primeira execução com conta real. (research §6)

**Checkpoint**: US1 completa — publicação real, atômica e idempotente.

---

## Phase 5: User Story 2 — Mensagens de erro claras (Priority: P1)

**Goal**: Recusas do ML viram mensagens pt-BR acionáveis, sem dados técnicos.

**Independent Test**: Forçar conta incompleta, categoria incompatível e atributo ausente → cada uma retorna mensagem específica sem dump técnico (V11).

- [ ] T026 [US2] Ampliar `SELLER_ERROR_MAP` e `mapMlError` em `backend/src/services/mercadolibre.js` cobrindo: listing type incompatível, `item.attributes.*` inválido, `item.pictures.*` rejeitada, preço/estoque inválido, além dos casos de vendedor já existentes. (FR-008, contracts/ads.md tabela)
- [ ] T027 [US2] Garantir que o handler de erro do `POST /ads` (e `PUT /ads`) nunca inclua no campo `error` payloads técnicos/tokens; `details` só quando seguro. (FR-009, V11)
- [ ] T028 [P] [US2] Documentar no `README.md` os pré-requisitos de conta de vendedor no ML (cadastro completo, 1º anúncio manual) e refletir no aviso já existente do frontend. (FR-010)

**Checkpoint**: US2 completa — mensagens acionáveis e seguras.

---

## Phase 6: User Story 4 — Autenticação estável em produção (Priority: P2)

**Goal**: Confirmar que o login sobrevive a reinício/múltiplas instâncias e que o OAuth resiste a CSRF/replay.

**Independent Test**: Reinício do backend no meio do fluxo → login conclui (V3); state inválido/reutilizado é rejeitado.

- [ ] T029 [US4] Verificar (e ajustar se necessário) que o state é consumido atomicamente e não pode ser reutilizado (o `findOneAndDelete` de T010 já garante uso único); adicionar checagem explícita de idade além do TTL no consumo. (FR-018)
- [ ] T030 [US4] Executar a verificação V3 do `quickstart.md` em ambiente de produção (Render) e registrar o resultado. (FR-017, SC-005)

**Checkpoint**: US4 completa — login estável e OAuth protegido.

---

## Phase 7: Testes de integração & verificação (cobre US1–US4)

**Purpose**: Suíte mínima automatizada + roteiro manual. Ref: quickstart.md, plan Fase 5.

- [ ] T031 [P] Teste de auth em `backend/tests/auth.test.js`: `/ml/login` persiste `OAuthState` no Mongo; callback com state inválido é rejeitado. (V3)
- [ ] T032 [P] Teste de auth em `backend/tests/auth.exchange.test.js`: `POST /auth/exchange` troca code válido uma vez (`200`) e falha na segunda (`410`). (V2)
- [ ] T033 [P] Teste de auth em `backend/tests/auth.me.test.js`: `GET /me` não retorna `_dump` nem tokens. (V4)
- [ ] T034 [P] Teste de ads em `backend/tests/ads.validation.test.js`: validações de entrada (título ≤60, preço>0, estoque≥1, 1–5 imagens). (FR-001)
- [ ] T035 [P] Teste de ads em `backend/tests/ads.mlerror.test.js`: mapeamento de erro do ML com API mockada via `nock` (conta incompleta, categoria incompatível, atributo inválido). (V11)
- [ ] T036 [P] Teste de ads em `backend/tests/ads.idempotency.test.js`: mesma `idempotency_key` não cria dois anúncios/itens (ML mockado). (V9)
- [ ] T036a [P] Teste de ads em `backend/tests/ads.description-warning.test.js`: item criado com sucesso mas `setDescription` falhando (ML mockado) retorna `201` com `description_warning`, sem abortar o anúncio. (FR-006)
- [ ] T037 Executar o roteiro manual E2E do `quickstart.md` (V1–V11) com conta de teste de vendedor e registrar resultados. (SC-001..SC-006)

**Checkpoint**: Caminhos de segurança e pontos frágeis de publicação cobertos por teste.

---

## Phase 8 (Opcional — fora do MVP): Webhooks de notificação do ML

**Purpose**: Substituir o sync por polling por notificações do tópico Items. Ref: research §11, FR (melhoria).

- [ ] T038 [US1] Criar `POST /api/notifications/ml` em `backend/src/routes/` para receber notificações do ML (validar origem/formato) e enfileirar processamento
- [ ] T039 [US1] Ao receber notificação do tópico `items`, atualizar o `Ad` local correspondente (buscar item no ML e refletir mudanças), reduzindo a dependência do `POST /ads/sync`
- [ ] T040 Configurar no DevCenter a "URL de retorno de notificações" apontando para `.../api/notifications/ml` e assinar o tópico Items; documentar no `README.md`

**Checkpoint**: Sync passivo por webhook (opcional).

---

## Phase 9: Polish & Cross-Cutting

- [ ] T041 [P] Atualizar `README.md` com: novo fluxo de login (exchange code), variáveis de ambiente, pré-requisitos de vendedor e nota de que segredos ficam só em env
- [ ] T042 Revisão final de segurança: confirmar que nenhum log imprime tokens/segredos; confirmar CORS/helmet em produção
- [ ] T043 Rodar a suíte (`cd backend && npm test`) e a validação do `quickstart.md` de ponta a ponta antes de considerar concluído

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (P0)**: ✅ concluída (externa) — pré-condição de todo o resto.
- **Phase 1 (Setup)**: sem dependências de código; pode começar já.
- **Phase 2 (Foundational)**: depende de Setup; **BLOQUEIA** as histórias (env + models são usados por todas).
- **Phase 3 (US3)**: depende de Phase 2 (usa `OAuthState`, `AuthCode`, `config/env`).
- **Phase 4 (US1)**: depende de Phase 2. Pode rodar em paralelo à Phase 3 (arquivos majoritariamente distintos: `ads.js`/`mercadolibre.js` vs `auth.js`), exceto T016 que toca `ads.js` — coordenar.
- **Phase 5 (US2)**: depende de Phase 4 (compartilha `ads.js`/`mercadolibre.js`); melhor após US1.
- **Phase 6 (US4)**: depende de Phase 3 (reusa o storage no Mongo).
- **Phase 7 (Testes)**: depende das fases que cobre (3–6).
- **Phase 8 (Webhooks)**: opcional; depois do MVP.
- **Phase 9 (Polish)**: por último.

### Ordem recomendada (single-dev)

1. Phase 1 → Phase 2 (fundação)
2. Phase 3 (US3 segurança de sessão) — **maior ganho de segurança**
3. Phase 4 (US1 publicação) — **maior ganho de produto**
4. Phase 5 (US2 erros) → Phase 6 (US4 estabilidade)
5. Phase 7 (testes) → Phase 9 (polish)
6. Phase 8 (webhooks) se/quando quiser

### Parallel Opportunities

- Setup: T001, T002, T003 em paralelo.
- Foundational: T006 e T007 em paralelo (models distintos); T004/T005/T008 sequenciais no boot.
- US3: T014 e T015 em paralelo com o bloco de exchange code (arquivos distintos).
- US1: T019 (model) em paralelo com T018 (doc).
- Testes: T031–T036 todos em paralelo (arquivos de teste distintos).

---

## Implementation Strategy

### MVP sugerido

O MVP real são **duas** histórias P1 que resolvem a dor declarada:

1. **US3 (Phase 3)** — para de vazar token/credenciais e conserta o login intermitente (a causa raiz de "às vezes não loga").
2. **US1 (Phase 4)** — publicação confiável e idempotente (a causa raiz de "não consigo criar anúncio").

Entregar Phase 1 → 2 → 3 → 4, validar V1–V3 e V8–V10 no `quickstart.md`, e já se tem uma aplicação segura que publica. US2, US4, testes e webhooks são incrementos subsequentes.

### Notas

- `[P]` = arquivos diferentes, sem dependência pendente.
- Rótulos [US1..US4] mapeiam para as histórias da `spec.md`.
- Commit após cada task ou grupo lógico; parar em cada checkpoint para validar.
- T025 (log estruturado do erro do ML) é chave: rode-o cedo na Phase 4 para descobrir a causa concreta da sua dificuldade atual de publicar.
