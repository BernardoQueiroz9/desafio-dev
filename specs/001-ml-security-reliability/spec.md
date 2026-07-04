# Feature Specification: Segurança e Confiabilidade na Publicação de Anúncios no Mercado Livre

**Feature Branch**: `001-ml-security-reliability`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Corrigir problemas de segurança e de confiabilidade na criação de anúncios no Mercado Livre da aplicação Desafio ML."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publicar um anúncio real no Mercado Livre com sucesso (Priority: P1)

Um vendedor autenticado preenche o formulário de anúncio (título, preço, estoque, imagens, categoria, descrição, frete) e publica. O anúncio é criado de fato no Mercado Livre e aparece tanto em "Meus Anúncios" quanto na conta real do vendedor no ML.

**Why this priority**: É a razão de existir da aplicação. Sem publicação confiável, nada mais importa. Hoje o fluxo falha de forma intermitente e com mensagens obscuras.

**Independent Test**: Com uma conta de vendedor ML válida e completa, preencher o formulário e publicar — verificar que o item existe no ML (via ID retornado) e que os dados batem.

**Acceptance Scenarios**:

1. **Given** um vendedor com cadastro ML completo e uma categoria compatível, **When** publica um anúncio válido, **Then** o item é criado no ML, salvo localmente e exibido em "Meus Anúncios" com o ID do ML.
2. **Given** um anúncio com imagens válidas, **When** publica, **Then** todas as imagens são enviadas ao ML e associadas ao item, ou a operação falha com mensagem clara indicando qual imagem foi rejeitada.
3. **Given** uma categoria que exige atributos obrigatórios, **When** o vendedor publica sem informá-los, **Then** o sistema resolve/solicita esses atributos e a publicação conclui sem erro de atributo faltante.
4. **Given** um vendedor autenticado, **When** publica dois anúncios em sequência, **Then** ambos são criados sem falha por concorrência ou por estado de sessão perdido.

---

### User Story 2 - Receber mensagens de erro claras quando o ML recusa o anúncio (Priority: P1)

Quando o Mercado Livre recusa a publicação (cadastro de vendedor incompleto, categoria incompatível, atributo inválido, imagem rejeitada, etc.), o vendedor recebe uma mensagem em português que explica a causa e o próximo passo concreto, em vez de um erro genérico ou de um dump técnico.

**Why this priority**: A maior parte das "dificuldades de publicar" hoje são erros do ML mal traduzidos. Uma boa mensagem resolve o problema do usuário sem suporte.

**Independent Test**: Forçar cada classe de erro conhecida (conta incompleta, categoria incompatível, atributo faltante) e verificar que a mensagem exibida é específica e acionável.

**Acceptance Scenarios**:

1. **Given** uma conta de vendedor com endereço/telefone pendente, **When** tenta publicar, **Then** a mensagem indica exatamente o que completar no ML e como.
2. **Given** uma categoria sem suporte ao tipo de anúncio usado, **When** tenta publicar, **Then** a mensagem sugere escolher outra categoria antes de a publicação ser tentada.
3. **Given** um erro inesperado do ML, **When** a publicação falha, **Then** a mensagem é amigável e nenhum dado sensível (tokens, payloads internos) é exposto ao usuário.

---

### User Story 3 - Sessão e credenciais protegidas (Priority: P1)

O vendedor faz login via Mercado Livre e usa a aplicação sem que seu token de sessão ou credenciais da plataforma fiquem expostos em URLs, históricos de navegador, logs ou respostas de API.

**Why this priority**: A aplicação lida com tokens de acesso a uma conta real de marketplace. Vazamento permite que terceiros ajam em nome do vendedor. Há exposições ativas hoje.

**Independent Test**: Inspecionar o fluxo de login (URLs, storage, respostas), o endpoint de perfil e os logs — confirmar que nenhum segredo ou token de sessão aparece onde não deveria.

**Acceptance Scenarios**:

1. **Given** o retorno do login OAuth, **When** o token de sessão é entregue ao frontend, **Then** ele não trafega na barra de endereços nem fica no histórico do navegador.
2. **Given** uma requisição ao perfil do usuário, **When** a resposta é retornada, **Then** ela contém apenas os campos necessários e nenhum dump completo do perfil ou dados de terceiros.
3. **Given** os segredos de produção que foram expostos, **When** a correção é aplicada, **Then** todos foram rotacionados e nenhum segredo está versionado no repositório.
4. **Given** um token do Mercado Livre expirado cujo refresh falha, **When** o vendedor faz uma ação, **Then** ele é direcionado a fazer login novamente com mensagem clara, em vez de receber um erro genérico.

---

### User Story 4 - Autenticação estável em produção (Priority: P2)

O login via Mercado Livre funciona de forma consistente em produção, mesmo quando o backend roda em mais de uma instância ou reinicia entre o início e o fim do fluxo OAuth.

**Why this priority**: O estado do OAuth hoje vive na memória de um processo. Reinícios (comuns no plano gratuito do Render) e múltiplas instâncias quebram o login de forma intermitente e difícil de diagnosticar.

**Independent Test**: Simular reinício do backend / troca de instância entre o clique em "Entrar" e o retorno do ML — verificar que o login ainda conclui.

**Acceptance Scenarios**:

1. **Given** o fluxo OAuth iniciado, **When** o backend reinicia antes do callback, **Then** o login ainda conclui com sucesso.
2. **Given** proteção contra CSRF/replay no OAuth, **When** um `state` é reutilizado ou inválido, **Then** o login é rejeitado com segurança.

---

### Edge Cases

- Vendedor tenta publicar com conta ML sem cadastro de vendedor concluído → mensagem específica de pré-requisitos, sem tentativa de publicação que gera erro cru.
- Categoria escolhida não suporta o tipo de anúncio → aviso antes de submeter.
- Uma das imagens é rejeitada pelo ML (formato/tamanho) → falha atômica com indicação de qual imagem, sem anúncio "meio criado".
- Descrição falha ao ser salva após o item ser criado → anúncio é criado, mas o usuário é avisado de que a descrição não foi aplicada.
- Token ML expira no meio de uma operação → refresh automático; se o refresh falhar, re-login.
- Origem de requisição fora da allowlist de CORS → bloqueada.
- Segredo ausente na configuração (ex.: JWT_SECRET) → aplicação não sobe silenciosamente com um padrão inseguro.

## Requirements *(mandatory)*

### Functional Requirements

#### Publicação de anúncios (confiabilidade)

- **FR-001**: O sistema MUST publicar um anúncio válido no Mercado Livre e refletir o item criado (com seu identificador do ML) no acervo local e na visão "Meus Anúncios".
- **FR-002**: O sistema MUST enviar todas as imagens selecionadas ao Mercado Livre antes de criar o item e MUST falhar a operação inteira, com mensagem clara, se qualquer imagem não puder ser enviada — sem criar anúncios parciais.
- **FR-003**: O sistema MUST resolver os atributos obrigatórios da categoria escolhida (incluindo garantia/sale_terms quando exigidos) de forma que a publicação não falhe por atributo obrigatório ausente; quando um valor não puder ser inferido, o sistema MUST solicitá-lo ao vendedor.
- **FR-004**: O sistema MUST verificar a compatibilidade da categoria com o tipo de anúncio antes de submeter e MUST informar o vendedor com antecedência quando a categoria for incompatível.
- **FR-005**: O sistema MUST validar o anúncio junto ao Mercado Livre antes da criação definitiva e MUST traduzir os erros de validação em mensagens acionáveis.
- **FR-006**: Quando o item é criado mas etapas complementares (ex.: descrição) falham, o sistema MUST concluir a criação e MUST avisar o vendedor sobre a etapa que não foi aplicada.
- **FR-007**: O sistema MUST reexecutar chamadas ao Mercado Livre que falham por causas transitórias (rede, limite de taxa, indisponibilidade momentânea) com recuo progressivo, sem duplicar a criação do item.

#### Mensagens de erro

- **FR-008**: O sistema MUST mapear as causas de recusa mais comuns do Mercado Livre (cadastro de vendedor incompleto, endereço/telefone/documento pendente, categoria incompatível, atributo inválido, imagem rejeitada) para mensagens em português com o próximo passo concreto.
- **FR-009**: O sistema MUST NOT expor ao usuário final dados técnicos sensíveis (tokens, payloads internos, stack traces) em mensagens de erro.
- **FR-010**: O sistema MUST comunicar claramente os pré-requisitos de cadastro de vendedor no Mercado Livre antes de o vendedor tentar publicar sem estar apto.

#### Segurança de sessão e credenciais

- **FR-011**: O sistema MUST entregar o token de sessão ao frontend após o login sem colocá-lo na URL/barra de endereços nem no histórico do navegador.
- **FR-012**: O sistema MUST limitar a resposta do perfil do usuário aos campos estritamente necessários, sem incluir dump completo do perfil do Mercado Livre ou dados não essenciais.
- **FR-013**: Todos os segredos de produção que foram expostos (segredo de assinatura de sessão, segredo do cliente do Mercado Livre, credenciais do banco) MUST ser rotacionados, e nenhum segredo MUST estar versionado no repositório.
- **FR-014**: O sistema MUST NOT iniciar em produção com segredos padrão inseguros; a ausência de um segredo obrigatório MUST impedir a subida ou ser claramente sinalizada.
- **FR-015**: O acesso ao banco de dados MUST ser restrito a origens autorizadas (lista de IPs restrita, em vez de acesso aberto a qualquer origem).
- **FR-016**: O sistema MUST tratar a falha de renovação do token do Mercado Livre encaminhando o vendedor ao login novamente, com mensagem clara, em vez de um erro genérico.

#### Autenticação estável e proteção do fluxo OAuth

- **FR-017**: O fluxo de login via Mercado Livre MUST concluir com sucesso mesmo quando o backend reinicia ou roda em múltiplas instâncias entre o início e o término do fluxo (o estado do OAuth não pode depender da memória de um único processo).
- **FR-018**: O sistema MUST proteger o fluxo OAuth contra CSRF/replay, rejeitando com segurança parâmetros de estado inválidos, ausentes ou reutilizados.
- **FR-019**: O sistema MUST aceitar requisições apenas de origens explicitamente autorizadas e MUST aplicar cabeçalhos de segurança adequados nas respostas.

### Key Entities *(include if feature involves data)*

- **Vendedor (usuário)**: Pessoa autenticada via Mercado Livre. Possui credenciais de acesso ao ML (token de acesso, token de renovação, validade) e status de aptidão para vender. As credenciais são sensíveis e nunca devem ser expostas.
- **Anúncio**: Item comercializado, espelhando um item real do Mercado Livre. Contém título, preço, estoque, imagens, descrição, categoria e opções de frete, além do identificador do item no ML e do vínculo com o vendedor.
- **Estado do OAuth**: Dado transitório que amarra o início e o fim do fluxo de login (proteção CSRF e verificador PKCE), com validade curta e necessidade de sobreviver a reinícios/instâncias.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um vendedor com cadastro ML completo consegue publicar um anúncio válido com sucesso em pelo menos 95% das tentativas, sem falhas intermitentes de sessão ou de estado.
- **SC-002**: 100% das recusas de publicação conhecidas (cadastro incompleto, categoria incompatível, atributo inválido, imagem rejeitada) resultam em uma mensagem específica e acionável, sem erros genéricos ou dumps técnicos.
- **SC-003**: Nenhum token de sessão aparece em URLs, histórico do navegador ou logs; nenhum segredo de produção está versionado no repositório; todos os segredos expostos foram rotacionados.
- **SC-004**: A resposta do perfil do usuário não contém nenhum campo sensível ou dump completo de terceiros — apenas os campos necessários à interface.
- **SC-005**: O login via Mercado Livre conclui com sucesso mesmo após reinício do backend durante o fluxo, verificado em ambiente de produção.
- **SC-006**: Uma falha de renovação de token leva o vendedor a um re-login claro em 100% dos casos, sem tela de erro genérica.

## Assumptions

- A aplicação continua sendo hospedada em backend gerenciado (Render), frontend estático (Vercel) e banco gerenciado (MongoDB Atlas); trocar de provedores está fora de escopo.
- O vendedor é responsável por completar seu próprio cadastro de vendedor no Mercado Livre; a aplicação orienta, mas não realiza esse cadastro.
- O tipo de anúncio padrão continua sendo o **Clássico** (`gold_special` no MLB — sem custo de exposição, com comissão na venda) atualmente usado, salvo decisão em contrário durante o planejamento. Evita-se o rótulo "gratuito", que não descreve com precisão esse tipo.
- Uma conta de vendedor de teste do Mercado Livre estará disponível para validar o fluxo de publicação de ponta a ponta.
- O escopo prioriza correção de segurança e confiabilidade do fluxo existente, não a adição de novos tipos de anúncio ou funcionalidades de marketplace.
- A rotação de segredos e a restrição de IP do banco envolvem ações em painéis externos (Render, Vercel, DevCenter do ML, Atlas), que o responsável pelo projeto executará com orientação do plano.
