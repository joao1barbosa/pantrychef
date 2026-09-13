# User Flows — PantryChef

Documentação dos fluxos de usuário do PantryChef para consulta do time de desenvolvimento.

---

## Flow 1: Cadastro e Login

**Ator**: Usuário não autenticado
**Pré-condição**: Nenhum

### Caminho principal

1. Usuário acessa `/register`
2. Preenche nome, email, senha e confirmação de senha
3. Sistema valida dados (email único, senha >= 6 caracteres, confirmação bate)
4. Sistema cria conta via `POST /users`
5. Sistema redireciona para `/login`
6. Usuário preenche email e senha
7. Sistema autentica via `POST /auth/login`
8. Sistema armazena JWT em localStorage
9. Sistema redireciona para `/` (Home)

### Caminhos alternativos

- **3a.** Email já cadastrado → exibe erro "Email já utilizado" (409)
- **3b.** Validação falha → exibe erros de campo (422)
- **7a.** Credenciais inválidas → exibe erro "Email ou senha incorretos" (401)

### Pós-condição

Usuário autenticado com token JWT em localStorage

---

## Flow 2: Busca de Receitas por Ingredientes

**Ator**: Usuário autenticado ou não
**Pré-condição**: Nenhum (busca é pública)

### Caminho principal

1. Usuário acessa `/` (Home)
2. Sistema exibe campo de busca com autocomplete de ingredientes
3. Usuário digita ingrediente e seleciona da lista (`GET /ingredients`)
4. Usuário adiciona 3+ ingredientes
5. Usuário clica em "Buscar receitas"
6. Sistema envia `POST /recipes/search` com lista de ingredientes
7. Sistema exibe resultados em cards (nome, categoria, tempo, dificuldade)
8. Usuário clica em uma receita
9. Sistema redireciona para `/recipes/:id`

### Caminhos alternativos

- **4a.** Menos de 3 ingredientes → botão desabilitado com mensagem "Adicione pelo menos 3 ingredientes"
- **6a.** Nenhuma receita encontrada → sistema aciona fallback de IA (indicador visual "Gerando receita...")
- **6b.** Erro na busca → exibe mensagem de erro genérica

### Estados vazios

- Tela inicial: "Adicione ingredientes para buscar receitas"
- Sem resultados após busca: "Nenhuma receita encontrada com esses ingredientes"

### Pós-condição

Receitas exibidas ou receita gerada por IA

---

## Flow 3: Visualização de Receita

**Ator**: Usuário autenticado ou não
**Pré-condição**: Receita existe no banco

### Caminho principal

1. Usuário acessa `/recipes/:id` (via busca, favoritos, histórico ou link direto)
2. Sistema carrega dados via `GET /recipes/:id`
3. Sistema exibe: nome, categoria, tempo de preparo, dificuldade, ingredientes (com quantidades), modo de preparo
4. Se usuário autenticado, sistema registra visualização em histórico
5. Usuário pode favoritar (se autenticado)
6. Usuário pode compartilhar (WhatsApp, copiar link)
7. Se usuário é autor, pode editar/deletar

### Caminhos alternativos

- **2a.** Receita não existe → exibe erro 404 "Receita não encontrada"
- **5a.** Usuário não autenticado → redireciona para `/login`
- **5b.** Já favoritada → botão muda para "Remover favorito"

### Pós-condição

Receita visualizada, possivelmente favoritada

---

## Flow 4: Gestão de Favoritos

**Ator**: Usuário autenticado
**Pré-condição**: Usuário tem token JWT válido

### Caminho principal

1. Usuário acessa `/favorites`
2. Sistema verifica autenticação (ProtectedRoute)
3. Sistema carrega favoritos via `GET /favorites`
4. Sistema exibe lista de cards de receitas favoritas
5. Usuário clica em uma receita
6. Sistema redireciona para `/recipes/:id`
7. Usuário pode remover favorito via botão no card
8. Sistema envia `DELETE /favorites` com recipe_id
9. Sistema remove card da lista

### Caminhos alternativos

- **2a.** Não autenticado → redireciona para `/login`
- **4a.** Nenhum favorito → exibe estado vazio "Nenhuma receita favorita"
- **8a.** Erro na remoção → exibe mensagem de erro

### Pós-condição

Lista de favoritos atualizada

---

## Flow 5: Histórico de Visualizações

**Ator**: Usuário autenticado
**Pré-condição**: Usuário tem token JWT válido

### Caminho principal

1. Usuário acessa `/history`
2. Sistema verifica autenticação (ProtectedRoute)
3. Sistema carrega histórico via `GET /history`
4. Sistema exibe lista de cards ordenados por data mais recente
5. Cada card mostra: nome da receita, categoria, data/hora da visualização
6. Usuário clica em uma receita
7. Sistema redireciona para `/recipes/:id`

### Caminhos alternativos

- **2a.** Não autenticado → redireciona para `/login`
- **4a.** Nenhum histórico → exibe estado vazio "Nenhuma receita visualizada"

### Pós-condição

Histórico visualizado

---

## Flow 6: Perfil do Usuário

**Ator**: Usuário autenticado
**Pré-condição**: Usuário tem token JWT válido

### Caminho principal

1. Usuário acessa `/profile`
2. Sistema verifica autenticação (ProtectedRoute)
3. Sistema carrega dados via `GET /users/me`
4. Sistema exibe: nome, email, data de cadastro
5. Usuário clica em "Editar perfil"
6. Sistema exibe formulário com campos editáveis (nome, email)
7. Usuário altera dados e clica em "Salvar"
8. Sistema envia `PATCH /users/me`
9. Sistema atualiza dados exibidos
10. Usuário pode editar preferências (categorias favoritas, restrições alimentares)
11. Sistema carrega preferências via `GET /users/me/preferences`
12. Usuário altera preferências e clica em "Salvar"
13. Sistema envia `PATCH /users/me/preferences`
14. Usuário clica em "Logout"
15. Sistema limpa localStorage e redireciona para `/login`

### Caminhos alternativos

- **2a.** Não autenticado → redireciona para `/login`
- **8a.** Email já utilizado → exibe erro "Email já utilizado" (409)
- **8b.** Validação falha → exibe erros de campo (422)

### Pós-condição

Dados atualizados ou usuário deslogado

---

## Flow 7: Criação de Receita

**Ator**: Usuário autenticado
**Pré-condição**: Usuário tem token JWT válido

### Caminho principal

1. Usuário acessa `/recipes/new`
2. Sistema verifica autenticação (ProtectedRoute)
3. Sistema exibe formulário com campos: nome, categoria, tempo de preparo, dificuldade, ingredientes (com quantidades), modo de preparo
4. Usuário preenche dados
5. Usuário adiciona ingredientes dinamicamente (botão "Adicionar ingrediente")
6. Usuário clica em "Criar receita"
7. Sistema valida formulário (campos obrigatórios, tempo > 0, dificuldade válida)
8. Sistema envia `POST /recipes`
9. Sistema vincula receita ao autor
10. Sistema redireciona para `/recipes/:id` (nova receita)

### Caminhos alternativos

- **2a.** Não autenticado → redireciona para `/login`
- **7a.** Validação falha → exibe erros de campo
- **8a.** Erro no servidor → exibe mensagem de erro genérica

### Pós-condição

Receita criada e vinculada ao autor

---

## Flow 8: Edição de Receita

**Ator**: Usuário autenticado (autor da receita)
**Pré-condição**: Usuário é autor da receita, token JWT válido

### Caminho principal

1. Usuário acessa `/recipes/:id/edit`
2. Sistema verifica autenticação (ProtectedRoute)
3. Sistema carrega dados da receita via `GET /recipes/:id`
4. Sistema preenche formulário com dados atuais
5. Usuário altera dados
6. Usuário clica em "Salvar alterações"
7. Sistema valida formulário
8. Sistema envia `PUT /recipes/:id`
9. Sistema redireciona para `/recipes/:id`

### Caminhos alternativos

- **2a.** Não autenticado → redireciona para `/login`
- **3a.** Receita não existe → exibe erro 404
- **3b.** Usuário não é autor → backend retorna 403, sistema exibe "Você não tem permissão para editar esta receita"
- **7a.** Validação falha → exibe erros de campo

### Pós-condição

Receita atualizada

---

## Flow 9: Navegação Principal

**Ator**: Usuário autenticado ou não
**Pré-condição**: Nenhum

### Caminho principal (mobile)

1. Usuário vê bottom navigation com 4 itens: Home, Favoritos, Histórico, Perfil
2. Usuário clica em um item
3. Sistema navega para rota correspondente com animação slide horizontal
4. Se rota é protegida e usuário não autenticado → redireciona para `/login`

### Caminho principal (desktop)

1. Usuário vê sidebar lateral com logo + 4 itens
2. Usuário clica em um item
3. Sistema navega para rota correspondente

### Rotas públicas

`/`, `/login`, `/register`, `/recipes`, `/recipes/:id`, `/ingredients`

### Rotas protegidas

`/recipes/new`, `/recipes/:id/edit`, `/favorites`, `/history`, `/profile`

### Pós-condição

Usuário na rota selecionada

---

## Resumo de Estados e Decisões

### Estados Globais

- **Autenticado**: JWT válido em localStorage
- **Não autenticado**: Sem JWT ou JWT expirado
- **Loading**: Requisições em andamento
- **Erro**: Falha na requisição
- **Vazio**: Sem dados para exibir

### Decisões de Roteamento

- Usuário tenta acessar rota protegida sem auth → redirect `/login`
- Usuário faz login com sucesso → redirect `/`
- Usuário faz logout → redirect `/login`
- Usuário cria receita com sucesso → redirect `/recipes/:id`
- Usuário edita receita com sucesso → redirect `/recipes/:id`

### Tratamento de Erros 401

- Interceptor global captura 401
- Limpa localStorage
- Redireciona para `/login`
- Exibe toast "Sessão expirada, faça login novamente"
