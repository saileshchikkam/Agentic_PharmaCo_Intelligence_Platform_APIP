from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.prediction import Prediction


class DashboardCRUD:

    @staticmethod
    def get_summary(db: Session, user_id: int):

        total_predictions = (
            db.query(Prediction)
            .filter(Prediction.user_id == user_id)
            .count()
        )

        total_unique_diseases = (
            db.query(
                func.count(
                    func.distinct(Prediction.predicted_disease)
                )
            )
            .filter(Prediction.user_id == user_id)
            .scalar()
        )

        average_confidence = (
            db.query(
                func.avg(Prediction.confidence)
            )
            .filter(Prediction.user_id == user_id)
            .scalar()
        )

        last_prediction = (
            db.query(Prediction.created_at)
            .filter(Prediction.user_id == user_id)
            .order_by(Prediction.created_at.desc())
            .first()
        )

        return {
            "total_predictions": total_predictions,
            "total_unique_diseases": total_unique_diseases or 0,
            "average_confidence": round(
                average_confidence or 0,
                2
            ),
            "last_prediction": (
                last_prediction[0]
                if last_prediction
                else None
            )
        }

    @staticmethod
    def get_recent_predictions(
        db: Session,
        user_id: int
    ):

        return (
            db.query(Prediction)
            .filter(Prediction.user_id == user_id)
            .order_by(Prediction.created_at.desc())
            .limit(10)
            .all()
        )

    @staticmethod
    def get_top_diseases(
        db: Session,
        user_id: int
    ):

        return (
            db.query(
                Prediction.predicted_disease,
                func.count(
                    Prediction.predicted_disease
                ).label("count")
            )
            .filter(Prediction.user_id == user_id)
            .group_by(Prediction.predicted_disease)
            .order_by(func.count(
                Prediction.predicted_disease
            ).desc())
            .limit(5)
            .all()
        )

    @staticmethod
    def get_activity(
        db: Session,
        user_id: int
    ):

        return (
            db.query(
                func.date(Prediction.created_at),
                func.count(Prediction.id)
            )
            .filter(Prediction.user_id == user_id)
            .group_by(
                func.date(Prediction.created_at)
            )
            .order_by(
                func.date(Prediction.created_at)
            )
            .all()
        )


dashboard_crud = DashboardCRUD()