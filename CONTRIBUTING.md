# Guia de Contribuição

Este guia define as convenções de commits, branches e organização de código do
PantryChef. Seguir estes padrões mantém o histórico limpo, o monorepo organizado e
as revisões mais rápidas.

## 📝 Nomenclatura de Commits

Seguimos a convenção [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/).
A estrutura base de um commit é:

```bash
<tipo>(escopo): <descrição>
```

_Exemplo: `feat(cadastro): validação de e-mail duplicado`_

### Tipos

| Tipo | Uso |
|---|---|
| `feat` | Nova funcionalidade. |
| `fix` | Correção de bug. |
| `refactor` | Alteração que não corrige bug nem adiciona funcionalidade. |
| `docs` | Alterações em documentação ou comentários. |
| `chore` | Mudanças que não afetam código ou usuário final (ex.: `.gitignore`). |
| `build` | Alterações no sistema de build ou dependências externas. |
| `ci` | Arquivos e scripts de configuração de CI. |
| `perf` | Melhorias de desempenho. |
| `style` | Formatação que não altera a lógica. |
| `test` | Criação ou alteração de testes. |

O **escopo** (opcional) identifica a área afetada, ex.: `api`, `auth`, `recipes`,
`docs`. A **descrição** deve ser curta, objetiva e no imperativo.

## 🗂 Estrutura do Projeto (Monorepo)

O repositório é um monorepo com apps e pacotes autocontidos:

```
pantrychef/
├── apps/
│   ├── api/                    # Backend FastAPI
│   │   ├── app/                # Código-fonte (models, schemas, services, routers)
│   │   ├── migrations/         # Versões do Alembic
│   │   ├── tests/              # Suíte de testes (pytest)
│   │   └── ...configs          # Dockerfile, alembic.ini, pytest.ini, requirements.txt
│   └── web/                    # (placeholder) front-end
├── packages/
│   └── shared-types/           # (placeholder) tipos compartilhados
├── db/                         # Dump inicial do banco
└── docker-compose*.yml         # Orquestração local
```

- Cada app possui **dependências, configurações e testes próprios**.
- **Não misture** código de apps diferentes em um mesmo arquivo.
- Ao adicionar dependências, atualize o `requirements.txt` do app afetado.

## 🌿 Estrutura de Branches

O repositório utiliza duas branches principais:

- **`main`** — código estável em produção.
- **`develop`** — branch de integração; todo desenvolvimento passa por aqui antes
  da `main`.

> [!Warning]
> Nunca faça push direto na `main`.

Para contribuir, crie uma branch a partir da `develop`. A nomenclatura reflete as
tarefas do Board de Projeto no GitHub, garantindo rastreabilidade:

```bash
<tipo>/<numero-da-task>-<nome-da-task>
```

_Exemplo: `feat/114-ajustes-na-tela-de-cadastro`_

- **Tipo:** `feat`, `fix`, `refactor`.
- **Número da task:** ID correspondente no Board de Projeto.
- **Nome da task:** título da tarefa no Board de Projeto.

## 🤝 Merge e Fluxo de Trabalho

O fluxo de integração segue a ordem: **task → develop → main**.

1. Crie uma branch a partir da `develop`.
2. Realize os commits seguindo o padrão descrito acima.
3. Abra um **Pull Request (PR)** direcionado à `develop`.
4. Descreva as alterações na PR para orientar o revisor.
5. Solicite a revisão do código.
6. Realize o merge após a aprovação.
7. Remova a branch da task após a conclusão do merge.

> [!important]
> O merge da branch `develop` na `main` é feito pelo gerente do projeto.

## 📐 Convenções de Código

### Um recurso por camada

Cada recurso do domínio (usuário, receita, ingrediente, favorito, histórico) tem um
arquivo próprio em cada camada:

```
app/
├── models/     # model.py     → ex.: app/models/recipe.py
├── schemas/    # schemas.py   → ex.: app/schemas/recipe.py
├── services/   # services.py  → ex.: app/services/recipe.py
└── routers/    # router.py    → ex.: app/routers/recipes.py
```

Assim, a navegação entre camadas para um mesmo recurso é direta e previsível.

### Routers finos

Os routers são apenas a **camada HTTP**: recebem a request, chamam o service e
devolvem o `response_model`. **Nenhuma regra de negócio** deve viver no router —
ela pertence ao service correspondente.

```python
# router (fino)
@router.get("/recipes/{receita_id}", response_model=RecipeOut)
def detalhar_receita(receita_id: UUID, service: RecipeService = Depends()):
    return service.obter_por_id(receita_id)
```

### Nunca retornar modelo do SQLAlchemy diretamente

A saída das rotas deve ser sempre um **schema Pydantic** (`response_model`), nunca
uma instância de modelo do SQLAlchemy. Isso desacopla a representação da API da
camada de persistência e evita vazamento de campos internos.

### Mudanças de esquema passam pelo Alembic

Qualquer alteração nas tabelas (nova coluna, nova tabela, índice, FK) deve ser feita
por **migração do Alembic**, nunca por SQL manual fora do versionamento:

```bash
# dentro do container da API
docker compose exec api alembic revision --autogenerate -m "descricao"
docker compose exec api alembic upgrade head
```

Revise a migração gerada antes de commitar — o `--autogenerate` pode não capturar
tudo. O `db/dump.sql` é uma referência de dados de exemplo e não substitui o
controle de versão do esquema.