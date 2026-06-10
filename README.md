# PantryChef

API para geração e busca de receitas a partir dos ingredientes que o usuário tem
em casa. Quando nenhuma receita cadastrada atende à busca, uma receita é gerada por
IA (Anthropic Claude) e persistida automaticamente.

## Sumário

- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Setup](#setup)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Configuração da IA (Claude)](#configuração-da-ia-claude)
- [Rotas](#rotas)
- [Regras de negócio](#regras-de-negócio)
- [Como rodar os testes](#como-rodar-os-testes)

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

## Setup

Pré-requisitos: Docker e Docker Compose.

1. Crie o arquivo `.env` a partir do exemplo:

   ```bash
   cp .env.example .env
   ```

2. Suba todo o ambiente com um único comando (a API aplica as migrações no boot e inicia o servidor):

   ```bash
   docker compose up --build
   ```

   A API fica disponível em `http://localhost:8000` e a documentação interativa em
   `http://localhost:8000/docs`.

Para desenvolvimento com recarregamento automático, use também o override:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Para popular ingredientes de exemplo (pt-BR):

```bash
docker compose exec api python -m app.seeds.ingredients
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão do PostgreSQL. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciais do banco. |
| `JWT_SECRET` | Segredo usado para assinar os tokens JWT. |
| `JWT_EXPIRE_MINUTES` | Validade do token em minutos (padrão `60`). |
| `AI_API_KEY` | Chave da API da Anthropic. |
| `AI_MODEL` | Modelo de IA (padrão `claude-haiku-4-5`). |
| `AI_TIMEOUT` | Tempo limite por chamada à IA, em segundos (padrão `30`). |
| `AI_MAX_TENTATIVAS` | Número de tentativas por geração (padrão `2`). |

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

## Rotas

### Públicas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Verificação de disponibilidade. |
| POST | `/users` | Cadastro de usuário. |
| POST | `/auth/login` | Autenticação e emissão de token. |
| GET | `/ingredients` | Lista de ingredientes. |
| GET | `/recipes` | Lista de receitas (filtros `nome` e `categoria`). |
| GET | `/recipes/{id}` | Detalhe de uma receita. |
| POST | `/recipes` | Criação de receita. |
| PUT | `/recipes/{id}` | Atualização de receita. |
| DELETE | `/recipes/{id}` | Remoção de receita. |
| POST | `/recipes/search` | Busca por ingredientes (mínimo de 3). |

### Protegidas (exigem token Bearer)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/users/me` | Perfil do usuário autenticado. |
| PATCH | `/users/me` | Atualização do perfil. |
| DELETE | `/users/me` | Exclusão lógica da conta. |
| GET | `/history` | Histórico de receitas visualizadas. |
| GET | `/favorites` | Lista de favoritos. |
| POST | `/favorites` | Favoritar receita. |
| DELETE | `/favorites/{receita_id}` | Remover favorito. |

## Regras de negócio

- **RN-01:** a busca por ingredientes exige no mínimo 3 ingredientes (`HTTP 422`).
- **RN-02:** a IA só é acionada quando não há receita correspondente no banco.
- **RN-03:** a receita gerada por IA é persistida antes de ser retornada.
- **RN-04:** e-mail duplicado no cadastro retorna `HTTP 409`.
- **RN-05:** histórico e favoritos são estritamente por usuário autenticado.
- **Busca por subconjunto:** uma receita só é retornada se todos os seus ingredientes
  estiverem entre os informados (ordenada por maior sobreposição).
- **Indisponibilidade da IA:** falhas resultam em `HTTP 503` controlado.

## Como rodar os testes

A suíte usa um PostgreSQL de testes. Com um banco disponível, defina
`TEST_DATABASE_URL` (ou `DATABASE_URL`) e rode:

```bash
pytest -q
```

## Documentação adicional

- [`GUIA_DEV.md`](GUIA_DEV.md) — guia de desenvolvimento.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — convenções de contribuição.
