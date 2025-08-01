from typing import Any, Union

from pydantic import AliasChoices, Field, field_validator
from pydantic.networks import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support.

    Values can be overridden via environment variables or when instantiating
    the class (e.g. in unit tests: ``Settings(debug=True)``).
    """
    # General application
    app_name: str = Field("Web BigDataCup API", alias="APP_NAME")
    debug: bool = Field(False, alias="DEBUG")

    # Chtbot
    OPENAI_API_KEY: str = Field(..., alias="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field("gpt-4.1-nano", alias="OPENAI_MODEL")

    # Database
    database_url: Union[str, PostgresDsn] = Field(
        "sqlite:///./app.db",
        validation_alias=AliasChoices("DATABASE_URL", "DB_URL"),
        alias="DATABASE_URL",
    )

    # CORS settings - comma separated list of origins, defaults to local dev server
    allowed_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        alias="ALLOWED_ORIGINS",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Ensure ``allowed_origins`` is always a list of strings.

        Accepts a comma-separated string (e.g. from environment) or an existing
        list and normalises it into a list of stripped origin strings.
        """
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, (list, tuple)):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        raise ValueError("allowed_origins must be a comma-separated string or a list of strings")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="",
        case_sensitive=False,
        validate_default=True,
        extra="allow",
    )




settings = Settings() 