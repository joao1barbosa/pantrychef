# PantryChef

API para geração e busca de receitas a partir dos ingredientes que o usuário tem
em casa. Quando nenhuma receita cadastrada atende à busca, uma receita é gerada por
IA (Anthropic Claude) e persistida automaticamente.

## Sumário

- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Setup rápido (Docker)](#setup-rápido-docker)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Configuração da IA (Claude)](#configuração-da-ia-claude)
- [Autenticação](#autenticação)
- [Rotas](#rotas)
- [Fluxo de uso (exemplo)](#fluxo-de-uso-exemplo)
- [Regras de negócio](#regras-de-negócio)
- [Migrações (Alembic)](#migrações-alembic)
- [Banco de dados (dump inicial)](#banco-de-dados-dump-inicial)
- [Como rodar os testes](#como-rodar-os-testes)
- [Documentação adicional](#documentação-adicional)

## Visão geral

- Cadastro e autenticação de usuários (JWT Bearer, senha com hash bcrypt).
- CRUD de receitas com ingredientes e quantidades.
- Busca por ingredientes (regra de subconjunto) e por nome/categoria.
- Fallback de IA com persistência da receita gerada.
- Histórico de receitas visualizadas e favoritos, por usuário.

## Stack

- Python 3.11 · FastAPI · SQLAlchemy 2 · Alembic
- PostgreSQL 15
- Anthropic SDK (modelo `claude-haiku-4-5`)
- Pytest
- Docker / Docker Compose

## Pré-requisitos

- **Docker** e **Docker Compose** (caminho recomendado).
- Para rodar a aplicação ou os testes fora do Docker: **Python 3.11+** e um
  **PostgreSQL** acessível.

## Setup rápido (Docker)

1. Crie o arquivo `.env` a partir do exemplo e ajuste os valores:

   ```bash
   cp .env.example .env
   ```

   Defina pelo menos um `JWT_SECRET` próprio. A `AI_API_KEY` só é necessária para o
   fallback de IA (veja [Configuração da IA](#configuração-da-ia-claude)).

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

## Estrutura do projeto

```
app/
  main.py            # instância FastAPI, registro de routers e /health
  config.py          # leitura das variáveis de ambiente (settings)
  database.py        # engine, SessionLocal, Base, get_db
  dependencies.py    # get_current_user, get_optional_user, get_ai_generator
  exceptions.py      # AIServiceUnavailable
  models/            # tabelas SQLAlchemy (Usuario, Receita, Ingrediente, ...)
  schemas/           # modelos Pydantic de entrada/saída
  services/          # regra de negócio, queries e integração com a IA
  routers/           # camada HTTP (request -> service -> response_model)
  seeds/             # carga inicial de dados (ingredientes em pt-BR)
  utils/             # utilitários (ex.: geração de slug)
migrations/          # versões do Alembic
tests/               # suíte de testes (pytest)
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | URL de conexão do PostgreSQL. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | sim | Credenciais do banco (usadas pelo container do Postgres). |
| `JWT_SECRET` | sim | Segredo usado para assinar os tokens JWT (mín. 32 bytes). |
| `JWT_EXPIRE_MINUTES` | não | Validade do token em minutos (padrão `60`). |
| `AI_API_KEY` | só p/ IA | Chave da API da Anthropic. |
| `AI_MODEL` | não | Modelo de IA (padrão `claude-haiku-4-5`). |
| `AI_TIMEOUT` | não | Tempo limite por chamada à IA, em segundos (padrão `30`). |
| `AI_MAX_TENTATIVAS` | não | Número de tentativas por geração (padrão `2`). |

## Configuração da IA (Claude)

A geração de receitas por IA é opcional: o restante da API funciona sem chave. Ela
só é acionada quando a busca por ingredientes não encontra nenhuma receita no banco
(RN-02).

1. Gere uma chave em [console.anthropic.com](https://console.anthropic.com) →
   **API Keys** → **Create Key** (formato `sk-ant-...`). A conta precisa de créditos
   ativos, caso contrário a chamada falha e a API responde `HTTP 503`.

2. Defina a chave no `.env`:

   ```env
   AI_API_KEY=sk-ant-sua-chave-aqui
   AI_MODEL=claude-haiku-4-5
   ```

3. Recarregue o container (as variáveis são lidas apenas no boot):

   ```bash
   docker compose up -d --force-recreate api
   ```

4. Para acionar o fallback, faça uma busca com no mínimo 3 ingredientes que não
   correspondam a nenhuma receita cadastrada:

   ```http
   POST /recipes/search
   {"ingredientes": ["<uuid1>", "<uuid2>", "<uuid3>"]}
   ```

   A receita é gerada em pt-BR, persistida e retornada. Falhas (chave inválida, sem
   crédito, timeout) resultam em `HTTP 503` controlado, com uma retentativa antes de
   falhar.

> Nos testes (`pytest`) a IA é sempre mockada — a chave real só é necessária para uso
> via Postman ou em produção.

## Autenticação

A autenticação é stateless via **JWT Bearer**.

1. **Cadastro** — `POST /users` com corpo **JSON**.
2. **Login** — `POST /auth/login` com corpo **`application/x-www-form-urlencoded`**
   (padrão OAuth2), campos `username` (e-mail) e `password`. **Não é JSON** — enviar
   JSON resulta em `HTTP 422`.
3. **Rotas protegidas** — envie o cabeçalho `Authorization: Bearer <access_token>`.

No Postman: aba **Body → x-www-form-urlencoded** para o login; aba
**Authorization → Bearer Token** para as rotas protegidas.

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
> Receitas geradas pela IA no fallback ficam sem autor (catálogo global).
>
> `GET /recipes/{receita_id}` é público, mas registra o acesso no histórico quando
> um token válido é enviado.

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

## Regras de negócio

- **RN-01:** a busca por ingredientes exige no mínimo 3 ingredientes (`HTTP 422`).
- **RN-02:** a IA só é acionada quando não há receita correspondente no banco.
- **RN-03:** a receita gerada por IA é persistida antes de ser retornada.
- **RN-04:** e-mail duplicado no cadastro retorna `HTTP 409`.
- **RN-05:** histórico e favoritos são estritamente por usuário autenticado.
- **RN-06:** criar receita exige autenticação; editar/remover é restrito ao autor (`HTTP 403`).
- **Busca por subconjunto:** uma receita só é retornada se todos os seus ingredientes
  estiverem entre os informados (ordenada por maior sobreposição).
- **Indisponibilidade da IA:** falhas resultam em `HTTP 503` controlado.

### Códigos de erro

| Código | Significado |
|---|---|
| `401` | Não autenticado / token inválido. |
| `403` | Autenticado, mas sem permissão (ex.: editar receita de outro usuário). |
| `404` | Recurso não encontrado. |
| `409` | E-mail já cadastrado. |
| `422` | Validação (ex.: menos de 3 ingredientes, ingrediente inexistente). |
| `503` | Serviço de IA indisponível. |

## Migrações (Alembic)

As migrações são aplicadas automaticamente no boot do container. Para rodar
manualmente:

```bash
# aplicar todas as migrações
alembic upgrade head

# criar uma nova migração a partir das alterações dos modelos
alembic revision --autogenerate -m "descricao"
```

O Alembic usa a variável `DATABASE_URL` do ambiente.

## Banco de dados (dump inicial)

O esquema é criado pelas migrações do Alembic (caminho padrão). Para quem prefere
SQL puro, o repositório inclui um **dump completo** em [`db/dump.sql`](db/dump.sql):
comandos `CREATE TABLE` de todas as tabelas (chaves, índices e FKs) e os `INSERT`
com dados de teste — **1 usuário**, **20 ingredientes** e **3 receitas** de exemplo.
A tabela `alembic_version` já vem carimbada na última revisão, então a aplicação
não tenta remigrar.

```bash
# fora do Docker (Postgres local)
createdb pantrychef
psql -d pantrychef -f db/dump.sql

# ou com o serviço db do compose no ar
docker compose exec -T db psql -U postgres -d pantrychef < db/dump.sql
```

Credenciais do usuário de teste: **`ana@example.com`** / senha **`senha123`**.

> Alternativa ao dump: subir via Docker (migrações no boot) e popular os
> ingredientes com `docker compose exec api python -m app.seeds.ingredients`.

## Como rodar os testes

A suíte usa um PostgreSQL dedicado e a IA é sempre mockada (nenhuma chamada real).

**Com Docker** (executa dentro do container da API, usando o Postgres do compose):

```bash
docker compose exec api pytest -q
```

**Localmente** (fora do Docker):

```bash
# 1. Crie e ative um ambiente virtual
python -m venv .venv
source .venv/bin/activate

# 2. Instale as dependências
pip install -r requirements.txt

# 3. Aponte para um Postgres de teste (sobrescreve a URL padrão dos testes)
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pantrychef_test

# 4. Rode a suíte
pytest -q
```

A URL do banco de testes é resolvida nesta ordem: `DATABASE_URL` (se definida),
senão `TEST_DATABASE_URL`. As tabelas são criadas automaticamente e o estado é limpo
entre os testes.

## Documentação adicional

- [`GUIA_DEV.md`](GUIA_DEV.md) — guia de desenvolvimento.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — convenções de contribuição.
