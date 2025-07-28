import os
import pandas as pd
from langchain.agents.agent_types import AgentType
from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent
from langchain_openai import ChatOpenAI
from ..settings.config import settings
from ..utils.logger import logger
from typing import Dict, Tuple, Optional

# Cache for agents keyed by (game_date, home_team, away_team)
_agents: Dict[Tuple[str, str, str], Optional[object]] = {}

# Load the full dataset once at module import
_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(os.path.dirname(_current_dir))
_dataset_path = os.path.join(_backend_dir, "data", "olympic_womens_dataset.csv")

try:
    _full_df = pd.read_csv(_dataset_path)
    # Normalise column names to snake_case (if not already)
    _full_df.columns = [c.strip().lower().replace(" ", "_") for c in _full_df.columns]
    logger.info("Loaded main dataset with shape %s", _full_df.shape)
except Exception as exc:
    logger.error("Failed to load main dataset: %s", exc)
    _full_df = pd.DataFrame()

# Player info (optional – not game-specific, so we can load once)
_player_info_path = os.path.join(_backend_dir, "data", "player_info.csv")
_player_df: Optional[pd.DataFrame] = None
if os.path.exists(_player_info_path):
    try:
        _player_df = pd.read_csv(_player_info_path)
        _player_df.columns = [c.strip().lower().replace(" ", "_") for c in _player_df.columns]
        logger.info("Loaded player info dataset with shape %s", _player_df.shape)
    except Exception as exc:
        logger.warning("Failed loading player info dataset: %s", exc)
        _player_df = None

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _make_agent_key(game_ctx: dict) -> Tuple[str, str, str]:
    return (
        str(game_ctx.get("game_date")),
        str(game_ctx.get("home_team")),
        str(game_ctx.get("away_team")),
    )


def _create_agent_for_game(game_ctx: dict):
    """Create and cache a pandas agent filtered to the given game."""
    key = _make_agent_key(game_ctx)
    if key in _agents and _agents[key] is not None:
        return _agents[key]

    # Validate dataset availability
    if _full_df.empty:
        logger.error("Full dataframe is empty; cannot create game-specific agent.")
        _agents[key] = None
        return None

    # Filter rows for this game – note: dataset columns lower-snake
    mask = (
        (_full_df["game_date"] == key[0])
        & (_full_df["home_team"] == key[1])
        & (_full_df["away_team"] == key[2])
    )
    game_df = _full_df.loc[mask].copy()

    if game_df.empty:
        logger.warning("No rows found for game %s", key)

    # Provide only the game-specific dataframe to the agent so that it is
    # always exposed as the variable `df` inside the python REPL.  This avoids
    # confusion about variable names (df, df1, …) that can lead the LLM to
    # reference an undefined variable and trigger parsing errors.
    df_input = game_df

    llm = ChatOpenAI(
        temperature=0,
        model=settings.OPENAI_MODEL,
        openai_api_key=settings.OPENAI_API_KEY,
    )

    PREFIX = (
        "You are PuckQuery, a hockey analytics assistant."
        " Use the provided pandas dataframe(s) to answer questions."
        " Follow this protocol:\n"
        "Thought:\nAction: python_repl_ast\nAction Input: <python>\n...\nFinal Answer: <answer>"
    )

    try:
        agent = create_pandas_dataframe_agent(
            llm,
            df_input,
            prefix=PREFIX,
            verbose=False,
            agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            handle_parsing_errors=True,
            allow_dangerous_code=True,
        )
        _agents[key] = agent
        logger.info("Created pandas agent for game %s with %d rows", key, len(game_df))
        return agent
    except Exception as exc:
        logger.error("Failed to create agent for game %s: %s", key, exc)
        _agents[key] = None
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def query_pandas_agent(query: str, game_ctx: dict):
    """Query the agent for the specified game.

    Parameters
    ----------
    query: str
        The user question.
    game_ctx: dict
        Dict with keys `game_date`, `home_team`, `away_team`.
    """
    agent = _create_agent_for_game(game_ctx)
    if agent is None:
        return "Pandas agent could not be initialized for the selected game."

    logger.info("Agent query for game %s: %s", _make_agent_key(game_ctx), query)
    try:
        result = agent.invoke(query)
        return result.get("output", "I could not find an answer.")
    except Exception as exc:
        logger.error("Error querying agent for game %s: %s", _make_agent_key(game_ctx), exc)
        return "An error occurred while processing your query."