from fastapi import FastAPI

app = FastAPI(
    title="Recipe Generator API",
    description="API para geração e busca de receitas por ingredientes.",
    version="0.1.0",
)


@app.get("/health", tags=["Status"])
def health_check():
    return {
        "status": "ok",
        "version": "0.1.0",
    }
