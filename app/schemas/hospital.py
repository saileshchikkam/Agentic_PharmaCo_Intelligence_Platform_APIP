from datetime import datetime
from pydantic import BaseModel


class HospitalCreate(BaseModel):
    hospital_name: str
    specialization: str
    address: str
    city: str
    state: str
    phone: str
    maps_url: str
    latitude: float | None = None
    longitude: float | None = None


class HospitalResponse(BaseModel):
    id: int
    hospital_name: str
    specialization: str
    address: str
    city: str
    state: str
    phone: str
    maps_url: str
    latitude: float | None
    longitude: float | None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }