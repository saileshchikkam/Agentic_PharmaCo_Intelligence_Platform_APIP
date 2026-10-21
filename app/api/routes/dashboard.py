from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User

from app.schemas.dashboard import (
    DashboardSummary,
    TopDisease,
    RecentPrediction,
    ActivityData
)

from app.services.dashboard_service import dashboard_service

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/summary",
    response_model=DashboardSummary
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return dashboard_service.get_summary(
        db,
        current_user.id
    )


@router.get(
    "/recent",
    response_model=list[RecentPrediction]
)
def get_recent_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return dashboard_service.get_recent_predictions(
        db,
        current_user.id
    )


@router.get(
    "/top-diseases",
    response_model=list[TopDisease]
)
def get_top_diseases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return dashboard_service.get_top_diseases(
        db,
        current_user.id
    )


@router.get(
    "/activity",
    response_model=list[ActivityData]
)
def get_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return dashboard_service.get_activity(
        db,
        current_user.id
    )