# PantryChef

Encontre receitas a partir dos ingredientes que você já tem em casa.

## Sumário

- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Arquitetura (monorepo)](#arquitetura-monorepo)
- [Decisões técnicas](#decisões-técnicas)
- [Rotas](#rotas)
- [Regras de negócio](#regras-de-negócio)
- [Códigos de erro](#códigos-de-erro)
- [Setup rápido (Docker)](#setup-rápido-docker)
- [Dev Container](#dev-container)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Fluxo de uso (exemplo)](#fluxo-de-uso-exemplo)
- [Como rodar os testes](#como-rodar-os-testes)
- [Integração contínua](#integração-contínua)
- [Melhorias futuras](#melhorias-futuras)
- [Autores](#autores)

## Visão geral

O PantryChef é uma aplicação web (SPA mobile-first) com API própria para busca e
geração de receitas a partir dos ingredientes disponíveis em casa. Quando nenhuma
receita cadastrada atende à busca, uma receita é gerada automaticamente (via
OpenRouter), marcada como "criada pela IA" e persistida no catálogo.

- Cadastro e autenticação de usuários (JWT Bearer, senha com hash bcrypt).
- CRUD completo de receitas com ingredientes e quantidades.
- Busca por ingredientes (regra de subconjunto) e por nome/categoria.
- Geração automática de receitas quando a busca não encontra resultado no banco.
- Histórico de receitas visualizadas e favoritos, por usuário.
- Interface web: busca por ingredientes, catálogo com filtros, detalhe com
  compartilhamento, favoritos, histórico, perfil e criação/edição de receitas.

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | Python 3.11 |
| API | FastAPI |
| ORM | SQLAlchemy 2 |
| Migrações | Alembic |
| Banco de dados | PostgreSQL 15 |
| Geração de receitas | OpenAI SDK via OpenRouter |
| Frontend | React 19 + Vite + TypeScript, Tailwind CSS v4 + shadcn/ui, TanStack Query, React Router |
| Testes | Pytest (API) · Vitest + Testing Library + MSW (web) |
| Infraestrutura | Docker / Docker Compose |

## Arquitetura (monorepo)

O repositório segue uma estrutura de monorepo, separando os aplicativos e os
pacotes compartilhados:

```
pantrychef/
├── apps/
│   ├── api/                    # Backend (FastAPI)
│   │   ├── app/
│   │   │   ├── main.py         # Instância FastAPI, registro de routers e /health
│   │   │   ├── config.py       # Leitura das variáveis de ambiente (settings)
│   │   │   ├── database.py     # engine, SessionLocal, Base, get_db
│   │   │   ├── dependencies.py # get_current_user, get_optional_user, get_recipe_generator
│   │   │   ├── exceptions.py   # RecipeGenerationUnavailable
│   │   │   ├── models/         # Tabelas SQLAlchemy (Usuario, Receita, Ingrediente, ...)
│   │   │   ├── schemas/        # Modelos Pydantic de entrada/saída
│   │   │   ├── services/       # Regras de negócio, queries e integração externa
│   │   │   ├── routers/        # Camada HTTP (request → service → response_model)
│   │   │   ├── seeds/          # Carga inicial de dados (ingredientes em pt-BR)
│   │   │   └── utils/          # Utilitários (ex.: geração de slug)
│   │   ├── migrations/         # Versões do Alembic
│   │   ├── tests/              # Suíte de testes (pytest)
│   │   ├── Dockerfile
│   │   ├── entrypoint.sh       # Aplica migrações e inicia o servidor
│   │   ├── alembic.ini
│   │   ├── pytest.ini
│   │   ├── requirements.txt      # Dependências de produção
│   │   └── requirements-dev.txt  # + ferramentas de teste
│   └── web/                    # Frontend (React + Vite), servido por nginx no Docker
│       ├── src/app/            # Rotas, layouts e providers
│       ├── src/features/       # Telas por domínio (auth, recipes, favorites, history, profile)
│       ├── src/shared/         # Componentes compartilhados (navegação, card de receita...)
│       ├── src/types/          # Tipos de domínio (contratos da API)
│       ├── src/lib/            # Cliente HTTP e utilitários
│       └── nginx.conf          # SPA + proxy /api → API, headers de segurança
├── packages/
│   └── shared-types/           # (placeholder) tipos compartilhados entre os apps
├── db/
│   └── dump.sql                # Dados de exemplo (idempotente)
├── .github/workflows/ci.yml    # Pipeline de CI
├── docker-compose.yml          # Ambiente completo (db + api + frontend)
└── docker-compose.dev.yml      # Override para desenvolvimento (reload, portas locais)
```

Cada app é autocontido (dependências, configurações e testes próprios), o que
permite evoluir a API e o front-end de forma independente.

## Decisões técnicas

### 1. OpenRouter como provedor de geração de receitas

A integração usa o **SDK da OpenAI** apontado para a **OpenRouter**, um endpoint
compatível com OpenAI que centraliza dezenas de modelos de vários provedores. Trocar
de modelo é apenas alterar a variável `AI_MODEL` — sem mudar código nem SDK. O modelo
padrão `openrouter/free` roteia para modelos gratuitos, suficiente para demonstrações
sem custo.

### 2. Geração de receitas como dependência injetada

O serviço de geração é injetado como dependência no router de busca, o que mantém a
camada HTTP desacoplada da integração externa e permite substituí-lo facilmente em
testes (mock) e em novos contextos de uso.

### 3. HTTP 503 com retentativa

Falhas na geração de receitas (chave inválida, sem crédito, timeout) resultam em
`HTTP 503` controlado, com uma retentativa antes de falhar. A API permanece estável e
informa o cliente de forma clara que o recurso externo está indisponível.

### 4. Autoria nas escritas

Criar receitas exige autenticação e vincula a receita ao autor. Editar ou remover é
permitido apenas ao autor (`HTTP 403` para terceiros). As consultas permanecem
públicas: o catálogo é compartilhado.

### 5. Busca por subconjunto

Uma receita só é retornada se **todos** os seus ingredientes estiverem entre os
informados na busca. Os resultados são ordenados por maior sobreposição de
ingredientes, priorizando as receitas que mais aproveitam o que o usuário tem.

### 6. IA apenas quando necessária

A busca por nomes (`POST /recipes/search-by-name`) resolve primeiro os ingredientes
já cadastrados; só os nomes desconhecidos são enviados à IA para validação. Assim a
busca continua funcionando com a IA fora do ar sempre que houver 3 ingredientes
conhecidos. O texto do usuário vai delimitado no prompt e a resposta da IA é
sanitizada antes de ser salva.

### 7. Proteções básicas

Limite de tentativas por IP no login, no cadastro e nas rotas que acionam IA (`HTTP 429` com
`Retry-After`), `JWT_SECRET` obrigatório com no mínimo 32 caracteres, e-mails sem
distinção de maiúsculas e headers de segurança (CSP, `X-Frame-Options`...) no nginx.

## Rotas

### Públicas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Verificação de disponibilidade. |
| POST | `/users` | Cadastro de usuário. |
| POST | `/auth/login` | Autenticação e emissão de token (form-urlencoded). |
| GET | `/ingredients` | Lista de ingredientes. |
| GET | `/recipes` | Lista de receitas: filtros `nome`, `categoria`, `tempo_min`, `tempo_max`, `dificuldade`; `ordenacao` (`recentes`, `populares`, `tempo_asc`, `tempo_desc`, `nome_asc`, `nome_desc`); paginação `limit`/`offset`. |
| GET | `/recipes/{receita_id}` | Detalhe de uma receita (`?registrar=false` não registra no histórico). |
| POST | `/recipes/search` | Busca por IDs de ingredientes (mínimo de 3). |
| POST | `/recipes/search-by-name` | Busca por nomes em texto livre (mínimo de 3, máximo de 10). |

### Protegidas (exigem token Bearer)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/users/me` | Perfil do usuário autenticado. |
| PATCH | `/users/me` | Atualização do perfil (nome, e-mail e/ou senha). |
| GET | `/users/me/preferences` | Preferências (categorias favoritas e restrições). |
| PATCH | `/users/me/preferences` | Atualização das preferências. |
| DELETE | `/users/me` | Exclusão lógica da conta. |
| POST | `/recipes` | Criação de receita (vinculada ao autor). |
| PUT | `/recipes/{receita_id}` | Atualização de receita (apenas o autor). |
| DELETE | `/recipes/{receita_id}` | Remoção de receita (apenas o autor). |
| GET | `/history` | Histórico de receitas visualizadas. |
| GET | `/favorites` | Lista de favoritos. |
| POST | `/favorites` | Favoritar receita. |
| DELETE | `/favorites/{receita_id}` | Remover favorito. |

> **Autoria das receitas:** criar uma receita exige autenticação e a vincula ao
> usuário (`usuario_id`). Editar ou remover é permitido **apenas ao autor** — outro
> usuário recebe `HTTP 403`. As consultas (`GET /recipes`, `GET /recipes/{id}`) e a
> busca (`POST /recipes/search`) permanecem públicas: o catálogo é compartilhado.
> Receitas geradas automaticamente no fallback ficam sem autor (catálogo global).
>
> `GET /recipes/{receita_id}` é público, mas registra o acesso no histórico quando
> um token válido é enviado.

## Regras de negócio

- **RN-01:** a busca por ingredientes exige no mínimo 3 ingredientes (`HTTP 422`).
- **RN-02:** a geração automática só é acionada quando não há receita correspondente
  no banco.
- **RN-03:** a receita gerada é persistida antes de ser retornada.
- **RN-04:** e-mail duplicado (sem distinção de maiúsculas) no cadastro ou na
  edição do perfil retorna `HTTP 409`.
- **RN-05:** histórico e favoritos são estritamente por usuário autenticado.
- **RN-06:** criar receita exige autenticação; editar/remover é restrito ao autor
  (`HTTP 403`).
- **Busca por subconjunto:** uma receita só é retornada se todos os seus ingredientes
  estiverem entre os informados (ordenada por maior sobreposição).
- **Indisponibilidade da geração:** falhas resultam em `HTTP 503` controlado.

### Códigos de erro

| Código | Significado |
|---|---|
| `401` | Não autenticado / token inválido. |
| `403` | Autenticado, mas sem permissão (ex.: editar receita de outro usuário). |
| `404` | Recurso não encontrado. |
| `409` | E-mail já cadastrado. |
| `422` | Validação (ex.: menos de 3 ingredientes, ingrediente inexistente ou repetido). |
| `429` | Muitas tentativas em pouco tempo (login, cadastro ou rotas de IA). |
| `503` | Serviço externo de geração de receitas indisponível. |

## Setup rápido (Docker)

1. Crie o arquivo `.env` a partir do exemplo:

   ```bash
   cp .env.example .env
   ```

   Defina um `JWT_SECRET` com pelo menos 32 caracteres (a API não sobe sem ele):
   `openssl rand -hex 32`. A `AI_API_KEY` só é necessária para a geração de receitas.

2. Suba todo o ambiente com um único comando:

   ```bash
   docker compose up --build
   ```

   - Aplicação web: `http://localhost:3000` (a API fica atrás do nginx em `/api`)
   - Na subida, a API aplica as migrações e popula o catálogo de ingredientes
     (desative com `SEED_INGREDIENTES=false`).
   - No compose padrão, API e Postgres **não** ficam expostos no host.

3. (Opcional) Carregue dados de exemplo — 1 usuário, 20 ingredientes e 3 receitas:

   ```bash
   docker compose exec -T db psql -U postgres -d pantrychef < db/dump.sql
   ```

### Desenvolvimento

O override de desenvolvimento adiciona recarregamento automático (bind mount +
`--reload`) e publica API e Postgres apenas em `127.0.0.1`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Swagger: `http://localhost:8000/docs` · ReDoc: `http://localhost:8000/redoc`
- Frontend com hot reload (fora do Docker): `cd apps/web && npm ci && npm run dev`
  (`http://localhost:5173`, com `VITE_API_URL=http://localhost:8000`).

### Migrações (Alembic)

As migrações são aplicadas automaticamente no boot do container. Para rodar
manualmente dentro do container da API:

```bash
# aplicar todas as migrações
docker compose exec api alembic upgrade head

# criar uma nova migração a partir das alterações dos modelos
docker compose exec api alembic revision --autogenerate -m "descricao"
```

O Alembic usa a variável `DATABASE_URL` do ambiente.

### Banco de dados (dados de exemplo)

O esquema é sempre criado pelas migrações do Alembic. O arquivo
[`db/dump.sql`](db/dump.sql) contém **apenas dados** (1 usuário, 20 ingredientes e
3 receitas), é idempotente e resolve as referências por slug/e-mail — pode ser
aplicado a qualquer momento depois que a API subiu:

```bash
docker compose exec -T db psql -U postgres -d pantrychef < db/dump.sql
```

Credenciais do usuário de teste: **`ana@example.com`** / senha **`senha123`**.

## Dev Container

O repositório inclui uma configuração de **Dev Container** (`.devcontainer/`) que
sobe o ambiente do `docker compose` com o override de desenvolvimento, com a pasta de trabalho apontando para a
raiz do monorepo (`/workspaces/pantrychef`) e as dependências da API instaladas
automaticamente. Para usar: abra o projeto no Visual Studio Code e escolha
**Reabrir no Container**. Extensões de Python, SQL e ferramentas de API já vêm
configuradas.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | URL de conexão do PostgreSQL. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | sim | Credenciais do banco (usadas pelo container do Postgres). |
| `JWT_SECRET` | sim | Segredo usado para assinar os tokens JWT (mín. 32 caracteres; a API não inicia sem ele). |
| `JWT_EXPIRE_MINUTES` | não | Validade do token em minutos (padrão `60`). |
| `AI_API_KEY` | só p/ geração | Chave da API da OpenRouter (`sk-or-...`). |
| `AI_BASE_URL` | não | Endpoint compatível com OpenAI (padrão `https://openrouter.ai/api/v1`). |
| `AI_MODEL` | não | Modelo de geração (padrão `openrouter/free`). |
| `AI_TIMEOUT` | não | Tempo limite por chamada externa, em segundos (padrão `30`). |
| `AI_MAX_TENTATIVAS` | não | Número de tentativas por geração (padrão `2`). |
| `RATE_LIMIT_LOGIN` | não | Tentativas de login por IP na janela (padrão `10`; `0` desativa). |
| `RATE_LIMIT_IA` | não | Buscas que podem acionar IA por IP na janela (padrão `15`; `0` desativa). |
| `RATE_LIMIT_JANELA_SEGUNDOS` | não | Tamanho da janela dos limites de login e IA (padrão `60`). |
| `RATE_LIMIT_CADASTRO` | não | Cadastros por IP na janela (padrão `10`; `0` desativa). |
| `RATE_LIMIT_CADASTRO_JANELA_SEGUNDOS` | não | Janela do limite de cadastro (padrão `3600`). |
| `CORS_ORIGINS` | não | Origens permitidas, separadas por vírgula (padrão: Vite em `:5173`). |
| `SEED_INGREDIENTES` | não | Popula o catálogo de ingredientes ao subir a API (padrão `true`). |

## Fluxo de uso (exemplo)

Usando `curl` com o override de desenvolvimento (base `http://localhost:8000`):

```bash
# 1. Cadastro (JSON)
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"nome":"Ana","email":"ana@example.com","senha":"senha123"}'

# 2. Login (form-urlencoded) — guarde o access_token retornado
curl -X POST http://localhost:8000/auth/login \
  -d "username=ana@example.com" -d "password=senha123"

# 3. Listar ingredientes (pegue os UUIDs)
curl http://localhost:8000/ingredients

# 4. Criar receita (rota protegida — vincula a receita ao autor)
curl -X POST http://localhost:8000/recipes \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Molho de Tomate","modo_preparo":"Cozinhe.","categoria":"Molho",
       "ingredientes":[{"ingrediente_id":"<uuid>","quantidade":"3"}]}'

# 5. Buscar por ingredientes (mínimo de 3 UUIDs)
curl -X POST http://localhost:8000/recipes/search \
  -H "Content-Type: application/json" \
  -d '{"ingredientes":["<uuid1>","<uuid2>","<uuid3>"]}'

# 6. Favoritar (rota protegida)
curl -X POST http://localhost:8000/favorites \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"receita_id":"<uuid>"}'
```

## Como rodar os testes

### API (pytest)

A suíte usa um PostgreSQL dedicado e o serviço de IA é sempre mockado (nenhuma
chamada externa real). **Ela nunca usa o banco da aplicação:** o banco de testes é
`TEST_DATABASE_URL` ou, na falta dele, o mesmo servidor do `DATABASE_URL` com o
sufixo `_test` (criado automaticamente). Bancos cujo nome não termina em `_test`
são recusados.

**Com Docker** (com o override de desenvolvimento no ar):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec api pytest -q
```

**Localmente** (fora do Docker):

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r apps/api/requirements-dev.txt
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pantrychef_test
cd apps/api && pytest -q
```

### Web (Vitest)

```bash
cd apps/web
npm ci
npm run test:run        # testes unitários e de integração (MSW simula a API)
npm run test:coverage   # relatório de cobertura em apps/web/coverage
npm run lint && npm run format:check && npm run build
```

## Integração contínua

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em todo push
e pull request para `develop` e `main`:

- **API:** Postgres de serviço, ciclo completo de migrações e `pytest`.
- **Web:** lint (sem avisos), Prettier, testes com cobertura e build.
- **Docker:** build das imagens do compose.

O deploy automático ainda depende da escolha da plataforma de hospedagem
(issue #25). A imagem do frontend recebe a URL da API no build (`VITE_API_URL`,
padrão `/api` via proxy do nginx).

## Melhorias futuras

- **Deploy automático** (pendente da escolha de plataforma, issue #25).
- **Tipos compartilhados** gerados a partir do OpenAPI em `packages/shared-types`.
- **Upload de fotos** das receitas.
- **Sugestões de receitas** com base no histórico e nas preferências.
- **Rate limit distribuído** (ex.: Redis) caso a API rode com várias réplicas.
- **Cache das consultas** para reduzir latência das listagens.

## Autores

João Barbosa e equipe — Projeto de cadeira de Engenharia de Software.