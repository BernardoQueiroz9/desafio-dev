# Implementation Plan: Segurança e Confiabilidade na Publicação de Anúncios no Mercado Livre

**Branch**: `001-ml-security-reliability` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-ml-security-reliability/spec.md`

## Summary

Endurecer a segurança da aplicação Desafio ML e tornar a publicação de anúncios no Mercado Livre confiável, sem reescrever o sistema. Duas frentes:

1. **Segurança**: rotacionar segredos expostos; trocar a entrega do JWT via query string por um **código de troca de uso único**; persistir o estado do OAuth (state + PKCE verifier) e o exchange code no **MongoDB com índice TTL** (elimina o `Map` em memória, resolvendo o login intermitente em produção); remover o `_dump` do `/me`; falhar rápido sem `JWT_SECRET`; tratar falha de refresh do token ML como re-login; revisar helmet/CORS/validação; restringir o IP Access List do Atlas.

2. **Confiabilidade de publicação**: conferir o `ML_REDIRECT_URI` contra o DevCenter; tornar o `POST /api/ads` robusto e idempotente (upload atômico de imagens, resolução de atributos obrigatórios + sale_terms, checagem de listing type, `/items/validate` antes de criar); ampliar o `mapMlError` com causas comuns e mensagens acionáveis em pt-BR.

Fora do MVP: substituir o sync por polling por **webhook de notificações do ML (tópico Items)**.

## Technical Context

**Language/Version**: Node.js 18+ (backend, CommonJS), JavaScript ES2022 + React 18 (frontend, Vite)

**Primary Dependencies**: Express, Mongoose, jsonwebtoken, axios, helmet, cors, form-data, mongodb-memory-server (fallback dev); React Router, axios (frontend)

**Storage**: MongoDB Atlas (produção) com fallback `mongodb-memory-server` (dev). Novas coleções com TTL: `oauthstates`, `authcodes`.

**Testing**: Nenhuma suíte hoje. Introduzir Jest + Supertest para testes de integração das rotas de auth/ads com a API do ML mockada (nock/axios-mock), mais um roteiro de verificação manual E2E com conta de teste de vendedor.

**Target Platform**: Backend em container Linux no Render; frontend estático na Vercel; navegadores modernos.

**Project Type**: Web application (frontend + backend separados, domínios distintos).

**Performance Goals**: Fluxo de baixo volume (uso individual/demonstração). Sem metas de throughput; foco em confiabilidade (SC-001: ≥95% de publicações bem-sucedidas) e latência aceitável do fluxo de publicação.

**Constraints**:
- Frontend (`vercel.app`) e backend (`onrender.com`) em domínios de registro distintos → sem cookies de terceiros confiáveis; token entregue via exchange code.
- Render free tier reinicia/hiberna → estado do OAuth não pode viver em memória de processo.
- API do Mercado Livre é a fonte de verdade dos anúncios; publicações são reais.

**Scale/Scope**: Poucos usuários simultâneos; dezenas de anúncios. Escopo é correção/endurecimento do fluxo existente, não novas funcionalidades de marketplace.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do projeto (`.specify/memory/constitution.md`) está no estado de template não preenchido — não há princípios ratificados que imponham gates. **Resultado: PASS (sem gates aplicáveis).**

Princípios pragmáticos adotados para esta feature (auto-impostos, não bloqueantes):
- **Sem reescrita**: alterar os arquivos existentes no lugar; não introduzir camadas novas sem necessidade.
- **Segredos fora do código**: nada de credencial versionada; falha explícita quando ausente.
- **Mudança segura**: cada alteração de segurança deve ser verificável (teste ou roteiro manual).

## Project Structure

### Documentation (this feature)

```text
specs/001-ml-security-reliability/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas e pesquisa
├── data-model.md        # Fase 1 — entidades e coleções (incl. TTL)
├── quickstart.md        # Fase 1 — guia de verificação E2E
├── contracts/           # Fase 1 — contratos das rotas afetadas
│   ├── auth.md
│   └── ads.md
└── checklists/
    └── requirements.md  # (da fase de spec)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── User.js            # getValidToken: erro tipado de re-login
│   │   ├── Ad.js              # (inalterado ou +campo de idempotência)
│   │   ├── OAuthState.js      # NOVO — state + code_verifier, TTL ~5min
│   │   └── AuthCode.js        # NOVO — exchange code de uso único, TTL ~60s
│   ├── routes/
│   │   ├── auth.js            # exchange code, /me enxuto, storage no Mongo
│   │   ├── ads.js             # publicação robusta/idempotente
│   │   └── categories.js      # (ajustes menores se necessário)
│   ├── services/
│   │   └── mercadolibre.js    # mapMlError ampliado, helpers de atributos
│   ├── config/
│   │   └── env.js             # NOVO — validação/fail-fast de env vars
│   └── server.js             # helmet/CORS revisados, remove dropIndex legado
└── tests/                     # NOVO — Jest + Supertest (integração auth/ads)

frontend/
└── src/
    ├── api.js                 # base axios (inalterado)
    ├── App.jsx                # Login: troca code por token (POST /auth/exchange)
    └── components/
        └── AdFormPage.jsx     # (ajustes de UX de erro se necessário)
```

**Structure Decision**: Mantém-se a estrutura web existente (backend/ + frontend/). Adições cirúrgicas: dois models com TTL, um módulo de config de env, e uma pasta de testes. Nenhuma pasta/camada arquitetural nova além dessas.

## Fases de entrega (ordem sugerida)

As fases abaixo orientam o `/speckit-tasks`. Prioridade segue a spec (P1 → P2), com um P0 operacional que precede o código.

- **Fase P0 — Contenção (ações externas, imediatas)**: rotacionar segredos, restringir Atlas, confirmar `.env` no `.gitignore`. Não depende de código; destrava tudo.
- **Fase 1 — Fundação de segurança (backend)**: config/env fail-fast; storage OAuth no Mongo (state + exchange code); `/me` enxuto; helmet/CORS.
- **Fase 2 — Entrega de token (backend+frontend)**: endpoint `/auth/exchange`; callback redireciona com code; frontend troca code por JWT.
- **Fase 3 — Refresh e re-login**: erro tipado em `getValidToken`; rotas convertem em 401 sinalizado; frontend redireciona ao login.
- **Fase 4 — Publicação confiável**: idempotência do `POST /ads`; upload atômico; atributos/sale_terms; `mapMlError` ampliado; validar `ML_REDIRECT_URI`.
- **Fase 5 — Verificação**: testes de integração (auth/ads com ML mockado) + roteiro E2E com conta de teste.
- **Fase 6 (fora do MVP) — Webhooks**: substituir sync por polling por notificações do tópico Items.

## Complexity Tracking

Sem violações de constituição a justificar (constituição não ratificada). Nenhuma complexidade adicional além dos dois models TTL e do módulo de config, ambos justificados pelos requisitos FR-011/FR-014/FR-017.
