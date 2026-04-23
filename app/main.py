from fastapi import FastAPI

from app.routers import auth, users

app = FastAPI(
    title="Recipe Generator API",
    description="API para geração e busca de receitas por ingredientes.",
    version="0.1.0",
)

app.include_router(auth.router)
app.include_router(users.router)


@app.get("/health", tags=["Status"])
def health_check():
    return {
        "status": "ok",
        "version": "0.1.0",
    }
