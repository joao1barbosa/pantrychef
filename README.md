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
- [Melhorias futuras](#melhorias-futuras)
- [Autores](#autores)

## Visão geral

O PantryChef é uma API para busca e geração de receitas a partir dos ingredientes
disponíveis em casa. Quando nenhuma receita cadastrada atende à busca, uma receita
é gerada automaticamente (via OpenRouter) e persistida no catálogo.

- Cadastro e autenticação de usuários (JWT Bearer, senha com hash bcrypt).
- CRUD completo de receitas com ingredientes e quantidades.
- Busca por ingredientes (regra de subconjunto) e por nome/categoria.
- Geração automática de receitas quando a busca não encontra resultado no banco.
- Histórico de receitas visualizadas e favoritos, por usuário.

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | Python 3.11 |
| API | FastAPI |
| ORM | SQLAlchemy 2 |
| Migrações | Alembic |
| Banco de dados | PostgreSQL 15 |
| Geração de receitas | OpenAI SDK via OpenRouter |
| Testes | Pytest |
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
│   │   └── requirements.txt
│   └── web/                    # (placeholder) front-end
├── packages/
│   └── shared-types/           # (placeholder) tipos compartilhados entre os apps
├── db/
│   └── dump.sql                # Dump inicial do banco (dados de exemplo)
├── docker-compose.yml
└── docker-compose.dev.yml      # Override para desenvolvimento
```

Cada app é autocontido (dependências, configurações e testes próprios), o que
permite evoluir a API e o futuro front-end de forma independente.

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

## Rotas

### Públicas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Verificação de disponibilidade. |
| POST | `/users` | Cadastro de usuário. |
| POST | `/auth/login` | Autenticação e emissão de token (form-urlencoded). |
| GET | `/ingredients` | Lista de ingredientes. |
| GET | `/recipes` | Lista de receitas (filtros `nome` e `categoria`). |
| GET | `/recipes/{receita_id}` | Detalhe de uma receita. |
| POST | `/recipes/search` | Busca por ingredientes (mínimo de 3). |

### Protegidas (exigem token Bearer)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/users/me` | Perfil do usuário autenticado. |
| PATCH | `/users/me` | Atualização do perfil (nome e/ou senha). |
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
- **RN-04:** e-mail duplicado no cadastro retorna `HTTP 409`.
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
| `422` | Validação (ex.: menos de 3 ingredientes, ingrediente inexistente). |
| `503` | Serviço externo de geração de receitas indisponível. |

## Setup rápido (Docker)

1. Crie o arquivo `.env` a partir do exemplo e ajuste os valores:

   ```bash
   cp .env.example .env
   ```

   Defina pelo menos um `JWT_SECRET` próprio. A `AI_API_KEY` só é necessária para a
   geração automática de receitas.

2. Suba todo o ambiente com um único comando. A API aplica as migrações no boot
   (`alembic upgrade head`) e inicia o servidor:

   ```bash
   docker compose up --build
   ```

   - API: `http://localhost:8000`
   - Swagger (interativo): `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

3. (Opcional) Popule ingredientes de exemplo em pt-BR — necessário para a busca por
   ingredientes:

   ```bash
   docker compose exec api python -m app.seeds.ingredients
   ```

Para desenvolvimento com recarregamento automático (bind mount + `--reload`), use o
override de desenvolvimento:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

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

### Banco de dados (dump inicial)

O esquema é criado pelas migrações do Alembic (caminho padrão). Para quem prefere
SQL puro, o repositório inclui um **dump completo** em [`db/dump.sql`](db/dump.sql):
comandos `CREATE TABLE` de todas as tabelas (chaves, índices e FKs) e os `INSERT`
com dados de teste — **1 usuário**, **20 ingredientes** e **3 receitas** de exemplo.
A tabela `alembic_version` já vem carimbada na última revisão, então a aplicação
não tenta remigrar.

```bash
# com o serviço db do compose no ar
docker compose exec -T db psql -U postgres -d pantrychef < db/dump.sql
```

Credenciais do usuário de teste: **`ana@example.com`** / senha **`senha123`**.

## Dev Container

O repositório inclui uma configuração de **Dev Container** (`.devcontainer/`) que
sobe o mesmo ambiente do `docker compose`, com a pasta de trabalho apontando para a
raiz do monorepo (`/workspaces/pantrychef`) e as dependências da API instaladas
automaticamente. Para usar: abra o projeto no Visual Studio Code e escolha
**Reabrir no Container**. Extensões de Python, SQL e ferramentas de API já vêm
configuradas.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | URL de conexão do PostgreSQL. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | sim | Credenciais do banco (usadas pelo container do Postgres). |
| `JWT_SECRET` | sim | Segredo usado para assinar os tokens JWT (mín. 32 bytes). |
| `JWT_EXPIRE_MINUTES` | não | Validade do token em minutos (padrão `60`). |
| `AI_API_KEY` | só p/ geração | Chave da API da OpenRouter (`sk-or-...`). |
| `AI_BASE_URL` | não | Endpoint compatível com OpenAI (padrão `https://openrouter.ai/api/v1`). |
| `AI_MODEL` | não | Modelo de geração (padrão `openrouter/free`). |
| `AI_TIMEOUT` | não | Tempo limite por chamada externa, em segundos (padrão `30`). |
| `AI_MAX_TENTATIVAS` | não | Número de tentativas por geração (padrão `2`). |

## Fluxo de uso (exemplo)

Usando `curl` (base `http://localhost:8000`):

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

A suíte usa um PostgreSQL dedicado e o serviço de geração é sempre mockado (nenhuma
chamada externa real).

**Com Docker** (executa dentro do container da API, usando o Postgres do compose):

```bash
docker compose exec api pytest -q
```

**Localmente** (fora do Docker, a partir de `apps/api/`):

```bash
# 1. Crie e ative um ambiente virtual
python -m venv .venv
source .venv/bin/activate

# 2. Instale as dependências
pip install -r apps/api/requirements.txt

# 3. Aponte para um Postgres de teste (sobrescreve a URL padrão dos testes)
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pantrychef_test

# 4. Rode a suíte
cd apps/api && pytest -q
```

A URL do banco de testes é resolvida nesta ordem: `DATABASE_URL` (se definida),
senão `TEST_DATABASE_URL`. As tabelas são criadas automaticamente e o estado é limpo
entre os testes.

## Melhorias futuras

- **Front-end (`apps/web`):** interface web consumindo a API, com tipos
  compartilhados em `packages/shared-types`.
- **Paginação e filtros avançados** nas listagens de receitas e ingredientes.
- **Upload de fotos** das receitas.
- **Compartilhamento de receitas** entre usuários.
- **Sugestões de receitas** com base no histórico de visualizações.
- **Métricas de uso** (receitas mais vistas, mais favoritadas).
- **Cache das consultas** para reduzir latência das listagens.

## Autores

João Barbosa e equipe — Projeto de cadeira de Engenharia de Software.