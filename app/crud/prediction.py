import json

from sqlalchemy.orm import Session

from app.models.prediction import Prediction


class PredictionCRUD:

    @staticmethod
    def create_prediction(
        db: Session,
        user_id: int,
        symptoms: list[str],
        predicted_disease: str,
        confidence: float,
        description: str,
        precautions: list[str]
    ):

        prediction = Prediction(
            user_id=user_id,
            symptoms=json.dumps(symptoms),
            predicted_disease=predicted_disease,
            confidence=confidence,
            description=description,
            precautions=json.dumps(precautions)
        )

        db.add(prediction)
        db.commit()
        db.refresh(prediction)

        return prediction

    @staticmethod
    def get_prediction_history(
        db: Session,
        user_id: int
    ):

        return (
            db.query(Prediction)
            .filter(Prediction.user_id == user_id)
            .order_by(Prediction.created_at.desc())
            .all()
        )

    @staticmethod
    def get_prediction_by_id(
        db: Session,
        prediction_id: int,
        user_id: int
    ):

        return (
            db.query(Prediction)
            .filter(
                Prediction.id == prediction_id,
                Prediction.user_id == user_id
            )
            .first()
        )

    @staticmethod
    def delete_prediction(
        db: Session,
        prediction_id: int,
        user_id: int
    ):

        prediction = (
            db.query(Prediction)
            .filter(
                Prediction.id == prediction_id,
                Prediction.user_id == user_id
            )
            .first()
        )

        if prediction:

            db.delete(prediction)

            db.commit()

            return True

        return False


prediction_crud = PredictionCRUD()