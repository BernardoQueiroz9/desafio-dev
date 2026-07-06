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

- **Conta vendedora no Mercado Livre** — a conta usada para entrar precisa estar habilitada a vender (cadastro completo: endereço, telefone e documentos). Publicar um anúncio real é uma ação da plataforma do ML e exige uma conta de vendedor; sem isso, o Mercado Livre recusa a publicação.

## Atenção

- Não foi possível remover a questão de segurança do projeto, para seguir clique em 'Saber mais' e 'Avançar para o site mesmo assim'

## Como anunciar na minha aplicação

Passo a passo para publicar um anúncio de verdade na sua conta do Mercado Livre.

### 1. Entrar

1. Acesse **https://desafio-dev-two.vercel.app**.
2. Clique em **"Entrar com Mercado Livre"**.
3. Faça login e **autorize** o aplicativo na tela do Mercado Livre. Você volta automaticamente já logado.

> 💡 Quer testar com outra conta? Use **Sair → "Sair da conta"** (botão vermelho). Isso desconecta do Mercado Livre e, no próximo acesso, permite escolher outra conta.

### 2. Abrir o formulário de anúncio

1. Vá em **"Meus Anúncios"**.
2. Clique em **"Novo Anúncio"**.

### 3. Preencher o anúncio

- **Título** — nome do produto (o app respeita o limite da categoria, mostrado ao lado).
- **Foto** — clique para adicionar. Para a imagem aparecer bem no Mercado Livre, siga o padrão:
  - Quadrada (1:1), **pelo menos 500×500 px** (ideal 1200×1200).
  - Fundo claro, **sem** texto, logo ou moldura.
  - O app ajusta o tamanho automaticamente e avisa se a imagem for pequena demais.
- **Categoria** — clique navegando pelas subcategorias **até o fim** (quando não houver mais subcategoria, ela é selecionada). Escolher a categoria certa é o passo mais importante (veja as dicas abaixo).
- **Ficha técnica** — se a categoria exigir atributos obrigatórios (ex.: marca, cor), o app mostra os campos automaticamente. Preencha-os.
- **Preço** e **Estoque** (mínimo 1).
- **Descrição** e opções de **frete**.

### 4. Publicar

1. Clique em **"Publicar Anúncio"**.
2. Se der tudo certo, o anúncio aparece em **"Meus Anúncios"** e na sua conta do Mercado Livre.

### 5. Conferir no Mercado Livre

- Em **mercadolivre.com.br**, logado, acesse **Vendas → Publicações** para ver o anúncio ativo.

## O que escolher para anunciar com sucesso

O app espelha as regras do Mercado Livre e avisa na tela quando algo não é permitido. Para uma publicação tranquila:

### Tipo de conta (vendedor)

- A conta precisa estar **habilitada a vender**. Se não estiver, aparece um aviso e o Mercado Livre recusa a publicação — complete o cadastro de vendedor no site do ML (menu **"Vender"**).
- O **tipo de anúncio** (Grátis, Clássico ou Premium) é escolhido **automaticamente** pelo app conforme o que a sua conta tem disponível. Contas de teste ou novas costumam ter apenas o tipo **Grátis**, o que é suficiente para publicar.

### Categorias

- **Escolha sempre uma categoria final** (a última da árvore, sem subcategorias).
- **Prefira categorias simples**, com poucos ou nenhum atributo obrigatório — a publicação é mais direta.
- **Evite categorias de catálogo restritas**, como **Celulares e Smartphones**: o Mercado Livre exige autorização de marca/catálogo e normalmente **bloqueia** vendedores comuns nessas categorias.
- **Evite categorias com atributos validados** que você não tem, como **Livros** (exigem o **ISBN/GTIN** real, validado pelo ML).
- Categorias com poucos atributos (por exemplo, subcategorias de **"Outros"** ou de **coleções**) são as mais fáceis para um primeiro anúncio.

> ℹ️ Se você escolher uma categoria que a sua conta não pode usar, o app deixa você tentar e mostra a **mensagem real do Mercado Livre** explicando o motivo — em vez de travar sem explicação.

## Funcionalidades

- Autenticação via OAuth do Mercado Livre (com PKCE), sem expor o token na URL
- CRUD de anúncios (criar, listar, editar, excluir) com publicação direta no ML
- Upload de imagem com compressão e validação de tamanho/qualidade
- Seletor hierárquico de categorias do Mercado Livre
- Formulário dinâmico de atributos obrigatórios da categoria
- Alertas e bloqueios espelhando as regras do Mercado Livre (limites de título, preço, fotos)
- Busca por título com filtro de preço
- Página "Meus Anúncios" com edição e exclusão
- Sincronização com o marketplace (detecção de divergências)
