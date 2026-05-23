import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "claude-haiku-4-5")
    AI_TIMEOUT: float = float(os.getenv("AI_TIMEOUT", "30"))
    AI_MAX_TENTATIVAS: int = int(os.getenv("AI_MAX_TENTATIVAS", "2"))


settings = Settings()
