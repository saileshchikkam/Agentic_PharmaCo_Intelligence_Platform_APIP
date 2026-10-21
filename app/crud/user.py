from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserRegister
from app.core.security import hash_password
from app.core.security import verify_password


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user: UserRegister):
    hashed_password = hash_password(user.password)

    db_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def authenticate_user(db: Session, email: str, password: str):

    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(
        password,
        user.password_hash
    ):
        return None

    return user


def update_user_name(
    db: Session,
    user: User,
    full_name: str
):
    user.full_name = full_name

    db.commit()
    db.refresh(user)

    return user


def update_user_password(
    db: Session,
    user: User,
    new_password: str
):
    user.password_hash = hash_password(new_password)

    db.commit()
    db.refresh(user)

    return user