from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UpdateProfile, ChangePassword
from app.core.security import verify_password

from app.crud.user import (
    update_user_name,
    update_user_password 
)


def get_profile(current_user: User):
    return current_user 


def update_profile(
    db: Session,
    current_user: User,
    profile: UpdateProfile
):
    return update_user_name(
        db,
        current_user,
        profile.full_name 
    )


def change_password(
    db: Session,
    current_user: User,
    password_data: ChangePassword
):

    if not verify_password(
        password_data.current_password,
        current_user.password_hash
    ):
        return None

    return update_user_password(
        db,
        current_user, 
        password_data.new_password
    ) 