from fastapi import FastAPI

from app.routers import auth, ingredients, recipes, users

TAGS_METADATA = [
    {"name": "Status", "description": "Verificação de disponibilidade da API."},
    {"name": "Autenticação", "description": "Login e emissão de tokens JWT."},
    {"name": "Usuários", "description": "Cadastro e gestão de contas de usuário."},
    {"name": "Ingredientes", "description": "Consulta de ingredientes disponíveis."},
    {"name": "Receitas", "description": "Cadastro, busca e geração de receitas."},
]

app = FastAPI(
    title="Recipe Generator API",
    description="API para geração e busca de receitas por ingredientes.",
    version="0.1.0",
    openapi_tags=TAGS_METADATA,
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(ingredients.router)
app.include_router(recipes.router)


@app.get(
    "/health",
    tags=["Status"],
    summary="Verificar saúde da API",
    description="Retorna o status de disponibilidade e a versão da aplicação.",
)
def health_check():
    return {
        "status": "ok",
        "version": "0.1.0",
    }
