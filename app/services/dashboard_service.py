from sqlalchemy.orm import Session

from app.crud.dashboard import dashboard_crud


class DashboardService:

    @staticmethod
    def get_summary(
        db: Session,
        user_id: int
    ):

        return dashboard_crud.get_summary(
            db,
            user_id
        )

    @staticmethod
    def get_recent_predictions(
        db: Session,
        user_id: int
    ):

        predictions = dashboard_crud.get_recent_predictions(
            db,
            user_id
        )

        result = []

        for prediction in predictions:

            result.append(
                {
                    "id": prediction.id,
                    "disease": prediction.predicted_disease,
                    "confidence": prediction.confidence,
                    "created_at": prediction.created_at
                }
            )

        return result

    @staticmethod
    def get_top_diseases(
        db: Session,
        user_id: int
    ):

        diseases = dashboard_crud.get_top_diseases(
            db,
            user_id
        )

        result = []

        for disease in diseases:

            result.append(
                {
                    "disease": disease[0],
                    "count": disease[1]
                }
            )

        return result

    @staticmethod
    def get_activity(
        db: Session,
        user_id: int
    ):

        activity = dashboard_crud.get_activity(
            db,
            user_id
        )

        result = []

        for row in activity:

            result.append(
                {
                    "date": str(row[0]),
                    "count": row[1]
                }
            )

        return result


dashboard_service = DashboardService()