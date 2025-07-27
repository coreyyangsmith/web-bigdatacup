from collections.abc import Callable
from typing import Any, Union

from pydantic import AliasChoices, Field, ImportString, validator
from pydantic.networks import PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support.

    Values can be overridden via environment variables or when instantiating
    the class (e.g. in unit tests: ``Settings(debug=True)``).
    """

    # General application
    app_name: str = Field("Web BigDataCup API", alias="APP_NAME")
    debug: bool = Field(False, alias="DEBUG")

    database_url: Union[str, PostgresDsn] = Field(
        "sqlite:///./app.db",
        validation_alias=AliasChoices("DATABASE_URL", "DB_URL"),
        alias="DATABASE_URL",  # so env alias works even when env_prefix is set
    )


    # Set model configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="",
        case_sensitive=False,
        validate_default=True,
    )




settings = Settings() 