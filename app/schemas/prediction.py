from datetime import datetime
from typing import List

from pydantic import BaseModel, Field, ConfigDict


class PredictionRequest(BaseModel):
    symptoms: List[str] = Field(
        ...,
        min_length=1,
        description="List of symptoms selected by the user"
    )


class PredictionResponse(BaseModel):
    predicted_disease: str
    confidence: float
    description: str
    precautions: List[str]


class PredictionHistoryResponse(BaseModel):
    id: int
    symptoms: List[str]
    predicted_disease: str
    confidence: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)