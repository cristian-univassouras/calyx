from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuracoes lidas de variaveis de ambiente (ver .env)."""

    # Conexao com o Postgres
    database_url: str = "postgresql+psycopg2://calyx:calyx@db:5432/calyx"

    # JWT
    jwt_secret: str = "troque-este-segredo-em-producao"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24h

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
