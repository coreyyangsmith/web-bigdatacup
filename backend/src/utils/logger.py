"""Shared logger configuration for the backend."""

import logging
from logging import config as logging_config

LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"

logging_config.dictConfig(
    {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {"format": LOG_FORMAT},
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": LOG_LEVEL,
                "formatter": "standard",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {"handlers": ["console"], "level": LOG_LEVEL},
    }
)

logger = logging.getLogger("backend") 