import os

from sqlalchemy.orm import Session

from app.crud.hospital import hospital_crud

from app.data.disease_specialization import DISEASE_SPECIALIZATION

GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")


class HospitalService:

    @staticmethod
    def create_hospital(
        db: Session,
        hospital_data
    ):

        return hospital_crud.create_hospital(
            db,
            hospital_data
        )

    @staticmethod
    def get_all_hospitals(
        db: Session
    ):

        return hospital_crud.get_all_hospitals(db)


    @staticmethod
    def search_by_city(
        db: Session,
        city: str
    ):

        return hospital_crud.get_hospitals_by_city(
            db,
            city
        )

    @staticmethod
    def get_nearby_hospitals(
        db: Session,
        disease: str,
        city: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None
    ):

        specialization = DISEASE_SPECIALIZATION.get(disease)

        if specialization is None:
            return []

        hospitals = hospital_crud.get_hospitals_by_specialization(
            db,
            specialization
        )

        if city:

            hospitals = [
                hospital
                for hospital in hospitals
                if hospital.city.lower() == city.lower()
            ]

        return hospitals
        

hospital_service = HospitalService()