"""Package exports for schema modules.

This file now only re-exports individual schema classes from their dedicated
modules.  Each model (Team, Player, Game, Event, etc.) lives in its own file
for clarity.
"""

from .team import TeamSchema  # noqa: F401
from .player import PlayerSchema  # noqa: F401
from .game import GameSchema  # noqa: F401
from .event import (
    EventSchema,
    EventBase,
    EventCreate,
    EventUpdate,
)  # noqa: F401

__all__ = [
    "TeamSchema",
    "PlayerSchema",
    "GameSchema",
    "EventSchema",
    "EventBase",
    "EventCreate",
    "EventUpdate",
]
