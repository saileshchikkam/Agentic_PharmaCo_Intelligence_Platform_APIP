from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.dependencies.auth import get_current_user

from app.models.user import User

from app.schemas.user import (
    UserProfile,
    UpdateProfile,
    ChangePassword
)

from app.services.user_service import (
    get_profile,
    update_profile,
    change_password
)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get(
    "/profile",
    response_model=UserProfile
)
def read_profile(
    current_user: User = Depends(get_current_user)
):
    return get_profile(current_user)


@router.put(
    "/profile",
    response_model=UserProfile
)
def update_user_profile(
    profile: UpdateProfile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return update_profile(
        db,
        current_user,
        profile
    )


@router.put("/change-password")
def update_password(
    password_data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    result = change_password(
        db,
        current_user,
        password_data
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    return {
        "message": "Password updated successfully"
    }