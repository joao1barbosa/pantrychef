# Guia do Desenvolvedor — Pantrychef

Bem-vindo ao projeto. Este guia cobre o essencial da stack para você começar a desenvolver sem precisar pesquisar tudo do zero. Leia com calma antes de começar sua primeira tarefa.

---

## Sumário

1. [Rodando o projeto](#1-rodando-o-projeto)
2. [Estrutura de pastas](#2-estrutura-de-pastas)
3. [FastAPI — criando endpoints](#3-fastapi--criando-endpoints)
4. [SQLAlchemy — modelos e banco de dados](#4-sqlalchemy--modelos-e-banco-de-dados)
5. [Pydantic — validação de dados](#5-pydantic--validação-de-dados)
6. [Alembic — migrations](#6-alembic--migrations)
7. [Fluxo de trabalho com Git](#7-fluxo-de-trabalho-com-git)

---

## 1. Rodando o projeto

Pré-requisitos: **VS Code** + extensão **Dev Containers** + **Docker** instalados.

```bash
# 1. Clone o repositório
git clone https://github.com/joao1barbosa/pantrychef.git
cd pantrychef

# 2. Copie o arquivo de variáveis de ambiente
cp .env.example .env
# Abra o .env e preencha a AI_API_KEY com a chave fornecida pelo gerente

# 3. Abra no VS Code
code .
```

Com o projeto aberto, o VS Code vai exibir um popup no canto inferior direito:

> **"Reopen in Container"** → clique nele.

Na primeira vez, o Docker vai baixar as imagens e instalar as dependências (~2 min). Nas próximas, abre em segundos.

Dentro do container, suba o servidor no terminal integrado (`Ctrl + '`):

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Acesse:
- `http://localhost:8000/health` → status da API
- `http://localhost:8000/docs` → documentação interativa (Swagger)
- `http://localhost:8000/redoc` → documentação alternativa

O flag `--reload` faz o servidor reiniciar automaticamente a cada vez que você salvar um arquivo.

---

## 2. Estrutura de pastas

```
pantrychef/
├── app/
│   ├── main.py          # Ponto de entrada — registra a aplicação e os routers
│   ├── database.py      # Configuração da conexão com o banco
│   ├── routers/         # Endpoints da API (um arquivo por recurso)
│   │   └── recipes.py   # ex: rotas de /recipes
│   ├── models/          # Tabelas do banco (SQLAlchemy)
│   │   └── recipe.py
│   ├── schemas/         # Validação de entrada/saída (Pydantic)
│   │   └── recipe.py
│   └── services/        # Lógica de negócio (consultas, integração com IA)
│       └── recipe.py
├── migrations/          # Arquivos de migration (Alembic)
├── .devcontainer/       # Configuração do ambiente de desenvolvimento
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── .env.example
```

**Regra geral:** cada recurso (receita, ingrediente) tem seu próprio arquivo em cada pasta. Não coloque tudo em um único arquivo gigante.

---

## 3. FastAPI — criando endpoints

O FastAPI organiza as rotas em **routers**. Cada router é um arquivo dentro de `app/routers/` que agrupa as rotas de um mesmo recurso.

### Criando um router

```python
# app/routers/recipes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.recipe import RecipeOut, RecipeCreate

router = APIRouter(prefix="/recipes", tags=["Recipes"])


@router.get("/", response_model=list[RecipeOut])
def list_recipes(db: Session = Depends(get_db)):
    # Depends(get_db) injeta a sessão do banco automaticamente
    recipes = db.query(Recipe).all()
    return recipes


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return recipe


@router.post("/", response_model=RecipeOut, status_code=201)
def create_recipe(data: RecipeCreate, db: Session = Depends(get_db)):
    recipe = Recipe(**data.model_dump())
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe
```

### Registrando o router no main.py

```python
# app/main.py
from app.routers import recipes

app.include_router(recipes.router)
```

### Métodos HTTP mais usados

| Decorador | Uso |
|---|---|
| `@router.get("/")` | Listar ou buscar recursos |
| `@router.get("/{id}")` | Buscar um recurso específico |
| `@router.post("/")` | Criar um novo recurso |
| `@router.put("/{id}")` | Atualizar um recurso completo |
| `@router.delete("/{id}")` | Remover um recurso |

### Parâmetros de rota e query

```python
# Parâmetro de rota → parte da URL
@router.get("/{recipe_id}")
def get_recipe(recipe_id: int): ...

# Query parameter → após o ? na URL (/recipes?limit=10)
@router.get("/")
def list_recipes(limit: int = 10, offset: int = 0): ...
```

---

## 4. SQLAlchemy — modelos e banco de dados

Os **models** representam as tabelas do banco. Cada atributo da classe vira uma coluna.

### Criando um model

```python
# app/models/recipe.py
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    ingredients = Column(Text, nullable=False)  # JSON serializado ou texto
    instructions = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### Operações básicas no banco

```python
# Buscar todos
recipes = db.query(Recipe).all()

# Buscar por ID
recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()

# Buscar com filtro de texto
results = db.query(Recipe).filter(Recipe.title.ilike(f"%{search}%")).all()

# Criar
new_recipe = Recipe(title="Bolo de cenoura", instructions="...")
db.add(new_recipe)
db.commit()
db.refresh(new_recipe)  # atualiza o objeto com o ID gerado

# Atualizar
recipe.title = "Novo título"
db.commit()

# Deletar
db.delete(recipe)
db.commit()
```

---

## 5. Pydantic — validação de dados

Os **schemas** definem o formato esperado dos dados que chegam na API (corpo da requisição) e dos dados que saem (resposta). O FastAPI usa eles para validar e documentar automaticamente.

```python
# app/schemas/recipe.py
from pydantic import BaseModel
from datetime import datetime


# Campos compartilhados entre criação e resposta
class RecipeBase(BaseModel):
    title: str
    description: str | None = None
    ingredients: str
    instructions: str


# Schema de entrada — o que o cliente manda no POST
class RecipeCreate(RecipeBase):
    pass


# Schema de saída — o que a API devolve
class RecipeOut(RecipeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # permite converter um model SQLAlchemy direto
```

**Regra:** nunca retorne um model SQLAlchemy diretamente. Sempre use um schema de saída (`RecipeOut`) como `response_model` no endpoint. Isso protege campos sensíveis e garante consistência.

---

## 6. Alembic — migrations

Migrations são arquivos que registram as mudanças no banco de dados. **Nunca altere o banco manualmente** — sempre crie uma migration.

### Criar uma nova migration

```bash
# Dentro do container (terminal integrado do VS Code)
alembic revision --autogenerate -m "descricao_da_mudanca"
```

O Alembic compara seus models com o estado atual do banco e gera o arquivo de migration automaticamente.

### Aplicar as migrations

```bash
alembic upgrade head
```

### Desfazer a última migration

```bash
alembic downgrade -1
```

### Fluxo correto ao adicionar uma tabela nova

1. Crie o model em `app/models/`
2. Importe o model em `migrations/env.py` para o Alembic detectá-lo
3. Rode `alembic revision --autogenerate -m "create_recipes_table"`
4. Revise o arquivo gerado em `migrations/versions/`
5. Rode `alembic upgrade head`
6. Faça commit do arquivo de migration junto com o model

---

## 7. Fluxo de trabalho com Git

**Nunca commite diretamente em `main` ou `develop`.** Todo desenvolvimento acontece em branches separadas.

### Começando uma nova tarefa

```bash
# Atualize o develop antes de criar sua branch
git checkout develop
git pull origin develop

# Crie sua branch a partir do develop
git checkout -b feature/nome-da-tarefa
```

### Convenção de nomes de branch

| Prefixo | Quando usar |
|---|---|
| `feature/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `docs/` | Documentação |
| `refactor/` | Melhoria de código sem nova funcionalidade |

Exemplos: `feature/rota-pesquisa-ingredientes`, `fix/erro-404-receita`

### Padrão de commits (Conventional Commits)

```bash
git commit -m "feat: adiciona rota de pesquisa por ingredientes"
git commit -m "fix: corrige erro 500 ao buscar receita inexistente"
git commit -m "docs: atualiza README com instruções de setup"
git commit -m "refactor: move lógica de busca para o service"
```

### Abrindo um Pull Request

```bash
# Suba sua branch
git push origin feature/nome-da-tarefa
```

No GitHub, abra um Pull Request da sua branch para `develop`. Preencha:
- O que foi feito
- Como testar

**Todo PR precisa ser aprovado por pelo menos um outro membro antes do merge.**

### Resumo do ciclo

```
develop → sua branch → commits → push → Pull Request → revisão → merge em develop
```
