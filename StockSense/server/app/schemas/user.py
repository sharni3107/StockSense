from datetime import datetime
from app.schemas.common import ORMBase, Role


class ProfileOut(ORMBase):
    id: str
    user_id: str
    name: str
    email: str
    role: Role
    created_at: datetime


class ProfileUpdate(ORMBase):
    name: str | None = None


class RegisterIn(ORMBase):
    name: str
    email: str
    password: str


class LoginIn(ORMBase):
    email: str
    password: str


class ForgotPasswordIn(ORMBase):
    email: str


class ResetPasswordIn(ORMBase):
    token: str
    password: str
