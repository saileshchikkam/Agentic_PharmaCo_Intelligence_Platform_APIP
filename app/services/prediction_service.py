import os
import pandas as pd
from pathlib import Path

from sqlalchemy.orm import Session

from app.crud.prediction import prediction_crud
from app.ml.predict import predictor


BASE_DIR = Path(__file__).resolve().parents[2]

DESCRIPTION_PATH = os.path.join(BASE_DIR, "app", "data", "symptom_Description.csv")

PRECAUTION_PATH = os.path.join(BASE_DIR, "app", "data", "symptom_precaution.csv")


class PredictionService:

    def __init__(self):

        self.description_df = pd.read_csv(DESCRIPTION_PATH)
        self.precaution_df = pd.read_csv(PRECAUTION_PATH)

    def get_description(self, disease: str) -> str:

        row = self.description_df[
            self.description_df["Disease"] == disease
        ]

        if row.empty:
            return "Description not available."

        return row.iloc[0]["Description"]

    def get_precautions(self, disease: str) -> list[str]:

        row = self.precaution_df[
            self.precaution_df["Disease"] == disease
        ]

        if row.empty:
            return []

        precautions = []

        for column in [
            "Precaution_1",
            "Precaution_2",
            "Precaution_3",
            "Precaution_4"
        ]:

            value = row.iloc[0][column]

            if pd.notna(value):
                precautions.append(str(value))

        return precautions

    def predict(
        self,
        db: Session,
        user_id: int,
        symptoms: list[str]
    ):

        result = predictor.predict(symptoms)

        disease = result["predicted_disease"]
        confidence = result["confidence"]

        description = self.get_description(disease)

        precautions = self.get_precautions(disease)

        prediction = prediction_crud.create_prediction(
            db=db,
            user_id=user_id,
            symptoms=symptoms,
            predicted_disease=disease,
            confidence=confidence,
            description=description,
            precautions=precautions
        )

        return {
            "id": prediction.id,
            "predicted_disease": disease,
            "confidence": confidence,
            "description": description,
            "precautions": precautions
        }

    def get_history(
        self,
        db: Session,
        user_id: int
    ):
        return prediction_crud.get_prediction_history(
            db,
            user_id
        )

    def get_prediction(
        self,
        db: Session,
        prediction_id: int,
        user_id: int
    ):
        return prediction_crud.get_prediction_by_id(
            db,
            prediction_id,
            user_id
        )

    def delete_prediction(
        self,
        db: Session,
        prediction_id: int,
        user_id: int
    ):
        return prediction_crud.delete_prediction(
            db,
            prediction_id,
            user_id
        )


prediction_service = PredictionService()