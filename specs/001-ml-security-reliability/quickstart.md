# Quickstart & Verificação: 001-ml-security-reliability

Guia para validar que segurança e publicação funcionam de ponta a ponta. Não contém código de implementação — só passos verificáveis.

## Pré-requisitos

1. **Conta de vendedor de teste no Mercado Livre** com cadastro **completo** (endereço, telefone, documentos) e apta a vender. Contas de teste podem ser criadas no DevCenter. Sem cadastro completo, o ML recusa a publicação — por design (ver FR-010).
2. **App no DevCenter do ML** configurada:
   - Redirect URI **HTTPS** exatamente igual ao `ML_REDIRECT_URI` do backend: `https://desafio-dev-api.onrender.com/api/auth/ml/callback`.
   - Escopos: `read`, `write`, `offline_access`.
   - PKCE habilitado.
3. **Segredos rotacionados** (após o vazamento): novo `JWT_SECRET`, novo `ML_CLIENT_SECRET` (via "Programar renovação"), nova senha do Mongo. IP Access List do Atlas restrito.
4. Local: Node 18+, `backend/.env` preenchido, `frontend/.env` com `VITE_API_URL`.

## Subir localmente

```bash
# backend
cd backend && npm install && npm start   # :3000
# frontend (outro terminal)
cd frontend && npm install && npm run dev # :5173
```

## Verificações de SEGURANÇA

### V1 — Token não vaza na URL (FR-011)
1. Faça login via ML.
2. Após o retorno, observe a barra de endereços: deve conter `?code=<opaco>` **momentaneamente** e, após a troca, uma URL limpa (`/dashboard`). **Nunca** deve aparecer `token=<JWT>`.
3. Verifique o histórico do navegador: nenhuma entrada com JWT.
- **Esperado**: token só trafega no corpo da resposta de `POST /auth/exchange`.

### V2 — Exchange code é de uso único (FR-011)
1. Capture o `code` da URL de callback.
2. Faça `POST /api/auth/exchange { code }` duas vezes.
- **Esperado**: 1ª → `200 { token }`; 2ª → `410` (code já usado). O documento `AuthCode` some após a 1ª troca.

### V3 — Login sobrevive a reinício do backend (FR-017)
1. Clique "Entrar com Mercado Livre".
2. **Antes** de concluir no ML, reinicie o backend (mata o processo).
3. Autorize no ML e deixe o callback voltar.
- **Esperado**: login conclui (o `state` está no Mongo, não na memória). Antes desta feature, falhava com `invalid_state`.

### V4 — /me não vaza dados (FR-012)
1. `GET /api/auth/me` autenticado.
- **Esperado**: JSON só com `name, email, ml_user_id, ml_nickname, ml_seller, ml_can_sell`. **Sem** `_dump`.

### V5 — Fail-fast sem JWT_SECRET (FR-014)
1. Rode o backend com `NODE_ENV=production` e sem `JWT_SECRET`.
- **Esperado**: processo encerra com mensagem clara; **não** sobe com secret default.

### V6 — Falha de refresh → re-login (FR-016)
1. Invalide/expire o `refresh_token` de um usuário no banco.
2. Faça uma ação autenticada (ex.: `GET /ads`).
- **Esperado**: `401 { code: "ML_REAUTH_REQUIRED" }`; o frontend redireciona para a tela de login.

### V7 — Segredos fora do repo (FR-013)
```bash
git grep -nE "H28Y2|euelion|sucesso123|mongodb\+srv://" $(git rev-list --all) || echo "OK: nenhum segredo no histórico"
cat .gitignore   # deve conter .env
```
- **Esperado**: nenhum segredo versionado; `.env` ignorado.

## Verificações de PUBLICAÇÃO no ML

### V8 — Publicar anúncio real (FR-001, SC-001)
1. Logado com a conta de teste apta, preencha o formulário (título ≤60, preço>0, estoque≥1, 1–5 imagens, categoria compatível) e publique.
- **Esperado**: `201` com `ml_id`; o item existe no ML (consultar `GET https://api.mercadolibre.com/items/<ml_id>`); aparece em "Meus Anúncios".

### V9 — Idempotência (FR-007)
1. Publique reenviando a **mesma** `idempotency_key` (simular retry).
- **Esperado**: um único item no ML; a 2ª chamada retorna o anúncio existente, sem duplicar.

### V10 — Upload atômico de imagem (FR-002)
1. Inclua uma imagem inválida junto de válidas e publique.
- **Esperado**: `400` indicando a imagem problemática; **nenhum** item criado no ML.

### V11 — Mensagens de erro acionáveis (FR-008, SC-002)
Force cada caso e confira a mensagem:
1. Conta sem cadastro completo → mensagem de pré-requisitos do vendedor.
2. Categoria incompatível com `gold_special` → sugestão de trocar categoria (antes de submeter).
3. Atributo obrigatório ausente → pedido do atributo específico.
- **Esperado**: mensagens pt-BR específicas, sem dump técnico nem tokens.

## Testes automatizados (quando implementados)

```bash
cd backend && npm test
```
Cobrindo: state persistido/validado, exchange code de uso único, `/me` enxuto, validações e mapeamento de erro do `POST /ads` (ML mockado via nock), guard de idempotência. Banco de teste via `mongodb-memory-server`.

## Critérios de conclusão (mapeados à spec)

| Verificação | Requisito | Success Criteria |
|---|---|---|
| V1, V2 | FR-011 | SC-003 |
| V3 | FR-017 | SC-005 |
| V4 | FR-012 | SC-004 |
| V5 | FR-014 | SC-003 |
| V6 | FR-016 | SC-006 |
| V7 | FR-013 | SC-003 |
| V8, V9, V10 | FR-001/002/007 | SC-001 |
| V11 | FR-008/009 | SC-002 |
