from fastapi import FastAPI
from app.api.routes import (
    auth,
    users,
    prediction,
    dashboard,
    hospital
)

from app.database.database import engine
from app.database.base import Base

import app.models.user
import app.models.prediction
import app.models.hospital

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MedAssist AI",
    description="AI-powered Disease Prediction System",
    version="1.0.0"
)

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

app.include_router(users.router)
app.include_router(prediction.router)
app.include_router(dashboard.router)
app.include_router(hospital.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to MedAssist AI API",
        "status": "Running Successfully"
    }