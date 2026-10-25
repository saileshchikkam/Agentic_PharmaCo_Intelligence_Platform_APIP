from dataclasses import dataclass
from pathlib import Path

GROQ_MODEL = 'qwen/qwen3.8-27b'


@dataclass(frozen=True)
class Settings:
    modular_enabled: bool = False
    repository_root: Path = Path(__file__).resolve().parents[3]
    # No credentials or private artifact roots in printable settings.
    groq_model: str = GROQ_MODEL

    def __post_init__(self):
        if self.groq_model != GROQ_MODEL:
            raise ValueError('SELECTED_GROQ_MODEL_REQUIRED')
