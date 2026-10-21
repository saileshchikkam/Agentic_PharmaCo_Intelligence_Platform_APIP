from sqlalchemy.orm import Session

from app.models.hospital import Hospital


class HospitalCRUD:

    @staticmethod
    def create_hospital(
        db: Session,
        hospital_data
    ):

        hospital = Hospital(
            hospital_name=hospital_data.hospital_name,
            specialization=hospital_data.specialization,
            disease=hospital_data.disease,
            address=hospital_data.address,
            city=hospital_data.city,
            state=hospital_data.state,
            phone=hospital_data.phone,
            maps_url=hospital_data.maps_url,
            latitude=hospital_data.latitude,
            longitude=hospital_data.longitude
        )

        db.add(hospital)
        db.commit()
        db.refresh(hospital)

        return hospital

    @staticmethod
    def get_all_hospitals(
        db: Session
    ):

        return (
            db.query(Hospital)
            .order_by(Hospital.hospital_name)
            .all()
        )
    @staticmethod
    def get_hospitals_by_specialization(
        db: Session,
        specialization: str
    ):

        return (
            db.query(Hospital)
            .filter(
                Hospital.specialization.ilike(f"%{specialization}%")
            )
            .all()
        )

    @staticmethod
    def get_hospitals_by_city(
        db: Session,
        city: str
    ):

        return (
            db.query(Hospital)
            .filter(
                Hospital.city.ilike(f"%{city}%")
            )
            .all()
        )


hospital_crud = HospitalCRUD()