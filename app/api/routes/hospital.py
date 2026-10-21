from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.hospital import (
    HospitalCreate,
    HospitalResponse
)

from app.services.hospital_service import hospital_service
from app.crud.hospital import hospital_crud

router = APIRouter(
    prefix="/hospital",
    tags=["Hospital Recommendation"]
)


@router.post(
    "/add",
    response_model=HospitalResponse
)
def add_hospital(
    hospital: HospitalCreate,
    db: Session = Depends(get_db)
):

    return hospital_service.create_hospital(
        db,
        hospital
    )


@router.get(
    "/all",
    response_model=list[HospitalResponse]
)
def get_all_hospitals(
    db: Session = Depends(get_db)
):

    return hospital_service.get_all_hospitals(db)


@router.get(
    "/specialization/{specialization}",
    response_model=list[HospitalResponse]
)
def get_hospitals_by_specialization(
    specialization: str,
    db: Session = Depends(get_db)
):

    return hospital_crud.get_hospitals_by_specialization(
        db,
        specialization
    )


@router.get(
    "/search",
    response_model=list[HospitalResponse]
)
def search_by_city(
    city: str,
    db: Session = Depends(get_db)
):

    return hospital_service.search_by_city(
        db,
        city
    )


@router.get(
    "/nearby",
    response_model=list[HospitalResponse]
)
def nearby_hospitals(
    disease: str,
    city: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    db: Session = Depends(get_db)
):

    return hospital_service.get_nearby_hospitals(
        db,
        disease,
        city,
        latitude,
        longitude
    )