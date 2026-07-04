# Contrato: Rotas de Anúncios

Base: `/api/ads`. Todas exigem `Authorization: Bearer <JWT>`. Foco nas mudanças de confiabilidade do `POST`.

## POST /api/ads — Publicar anúncio

- **Body**:

```json
{
  "title": "string (<=60)",
  "price": 0,
  "available_quantity": 1,
  "images": ["dataURL", "..."],
  "description": "string",
  "category_id": "MLBxxxx",
  "attributes": [ { "id": "...", "value_id|value_name": "..." } ],
  "free_shipping": false,
  "is_full": false,
  "idempotency_key": "string (opcional)"
}
```

- **Validação de entrada** (400 com mensagem pt-BR): título obrigatório ≤60; preço > 0; estoque ≥1; 1–5 imagens; categoria obrigatória.

- **Fluxo robusto**:
  1. Carrega `User`; obtém token válido (`getValidToken`; pode lançar `MlReauthRequired` → 401 `ML_REAUTH_REQUIRED`).
  2. **[MUDANÇA] Guard de idempotência**: se `idempotency_key` já corresponde a um `Ad` existente do usuário, retorna esse anúncio (200/201) sem recriar no ML.
  3. Verifica `available_listing_types` da categoria para `gold_special`; incompatível → `400` mensagem sugerindo outra categoria.
  4. **Upload atômico** de todas as imagens; se qualquer uma falhar → `400` indicando qual, **sem** criar item.
  5. Resolve atributos obrigatórios (`getCategoryRequiredAttributes`) + `sale_terms`/garantia; valor obrigatório não inferível → `400` pedindo o atributo.
  6. `POST /items/validate`; erros → `400` traduzidos (`mapMlError`).
  7. `createItem` **uma única vez** (não reexecutar cegamente em retry pós-criação).
  8. `setDescription` (falha aqui não invalida o item → `description_warning`).
  9. Persiste `Ad` local com `ml_id`, `idempotency_key`, imagens, categoria.

- **Respostas**:
  - `201 Ad` (com `description_warning?` opcional).
  - `400 { error, details? }` — validação/recusa do ML, mensagem acionável, **sem vazar payload técnico** no `error` (o `details` só quando seguro).
  - `401 { error, code: "ML_REAUTH_REQUIRED" }` — reautorização ML necessária.

## GET /api/ads — Listar

Inalterado. Filtros `search`, `minPrice`, `maxPrice`, `mine=true`. `search` já é escapado contra regex injection.

## GET /api/ads/:id — Detalhe

Inalterado (preenche `category_name` sob demanda).

## PUT /api/ads/:id — Editar

- Validação de estoque ≥1. Atualiza item no ML (`updateItem`) e descrição. Reflete no `Ad` local.
- **[MUDANÇA menor]** Propagar `MlReauthRequired` como `401 ML_REAUTH_REQUIRED`.

## DELETE /api/ads/:id — Remover

- Fecha item no ML (`status: 'closed'`) e remove `Ad` local. Falha ao fechar no ML é logada mas não impede a remoção local (comportamento atual mantido).

## POST /api/ads/sync — Sincronizar (MVP: mantido)

- Compara título/preço/estoque local vs. ML; retorna `{ divergences, failed, checked }`.
- **Fase futura (fora do MVP)**: substituir por webhook do tópico Items (ver research §11).

## Mensagens de erro (mapMlError) — cobertura mínima

| Causa ML | Mensagem pt-BR (acionável) |
|---|---|
| `seller.unable_to_list` / address_pending | Completar endereço/telefone/documentos no ML e criar 1 anúncio manual para liberar a conta. |
| identification_pending | Completar verificação de identidade no ML. |
| phone_pending | Confirmar telefone no ML. |
| listing type incompatível | Categoria não suporta este tipo de anúncio; escolher outra. |
| `item.attributes.*` inválido | Atributo X inválido/obrigatório; informar valor correto. |
| `item.pictures.*` | Imagem rejeitada (formato/tamanho); enviar outra. |
| preço/estoque inválido | Corrigir preço (>0) / estoque (≥1). |
| genérico/desconhecido | Mensagem amigável de falha, sem dados técnicos. |
