from sqlalchemy.orm import Session

from app.schemas.user import UserRegister
from app.crud.user import (
    create_user,
    get_user_by_email,
    authenticate_user
)
from app.core.security import create_access_token


def register_user(db: Session, user: UserRegister):
    """
    Register a new user.
    """

    existing_user = get_user_by_email(db, user.email)

    if existing_user:
        return None

    return create_user(db, user)


def login_user(db: Session, email: str, password: str):
    """
    Authenticate user and generate JWT token.
    """

    user = authenticate_user(db, email, password)

    if not user:
        return None

    access_token = create_access_token(
        {"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }