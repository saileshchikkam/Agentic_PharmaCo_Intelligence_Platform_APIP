from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    full_name: str = Field(
        min_length=3,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=100
    )


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }


class UserProfile(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }


class UpdateProfile(BaseModel):
    full_name: str = Field(
        min_length=3,
        max_length=100
    )


class ChangePassword(BaseModel):
    current_password: str

    new_password: str = Field(
        min_length=8,
        max_length=100
    )