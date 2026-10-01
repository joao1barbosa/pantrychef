import os

from dotenv import load_dotenv

load_dotenv()

JWT_SECRET_MIN_LENGTH = 32


def _jwt_secret() -> str:
    segredo = os.getenv("JWT_SECRET", "")
    if len(segredo) < JWT_SECRET_MIN_LENGTH:
        raise RuntimeError(
            f"JWT_SECRET ausente ou curto demais (mínimo de {JWT_SECRET_MIN_LENGTH} caracteres)."
        )
    return segredo


class Settings:
    JWT_SECRET: str = _jwt_secret()
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_BASE_URL: str = os.getenv("AI_BASE_URL", "https://openrouter.ai/api/v1")
    AI_MODEL: str = os.getenv("AI_MODEL", "openrouter/free")
    AI_TIMEOUT: float = float(os.getenv("AI_TIMEOUT", "30"))
    AI_MAX_TENTATIVAS: int = int(os.getenv("AI_MAX_TENTATIVAS", "3"))
    AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "4096"))
    RATE_LIMIT_LOGIN: int = int(os.getenv("RATE_LIMIT_LOGIN", "10"))
    RATE_LIMIT_IA: int = int(os.getenv("RATE_LIMIT_IA", "15"))
    RATE_LIMIT_JANELA_SEGUNDOS: int = int(os.getenv("RATE_LIMIT_JANELA_SEGUNDOS", "60"))
    RATE_LIMIT_CADASTRO: int = int(os.getenv("RATE_LIMIT_CADASTRO", "10"))
    RATE_LIMIT_CADASTRO_JANELA_SEGUNDOS: int = int(
        os.getenv("RATE_LIMIT_CADASTRO_JANELA_SEGUNDOS", "3600")
    )
    CORS_ORIGINS: list[str] = [
        origem.strip()
        for origem in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origem.strip()
    ]


settings = Settings()
