from datetime import datetime

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_predictions: int
    total_unique_diseases: int
    average_confidence: float
    last_prediction: datetime | None


class TopDisease(BaseModel):
    disease: str
    count: int


class RecentPrediction(BaseModel):
    id: int
    disease: str
    confidence: float
    created_at: datetime


class ActivityData(BaseModel):
    date: str
    count: int