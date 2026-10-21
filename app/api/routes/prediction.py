from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
)
from app.services.prediction_service import prediction_service
from app.ml.model_loader import loader

router = APIRouter(
    prefix="/prediction",
    tags=["Prediction"]
)


@router.get("/symptoms")
def get_available_symptoms():
    """
    Returns all available symptoms for the frontend.
    """
    return {
        "symptoms": sorted(loader.symptom_columns)
    }


@router.post(
    "/predict",
    response_model=PredictionResponse
)
def predict_disease(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return prediction_service.predict(
        db=db,
        user_id=current_user.id,
        symptoms=request.symptoms
    )


@router.get("/history")
def prediction_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return prediction_service.get_history(
        db,
        current_user.id
    )


@router.get("/{prediction_id}")
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    prediction = prediction_service.get_prediction(
        db,
        prediction_id,
        current_user.id
    )

    if prediction is None:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found"
        )

    return prediction


@router.delete("/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    deleted = prediction_service.delete_prediction(
        db,
        prediction_id,
        current_user.id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found"
        )

    return {
        "message": "Prediction deleted successfully"
    }