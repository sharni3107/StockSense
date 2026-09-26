from datetime import datetime, timedelta
from email.message import EmailMessage
import smtplib

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_manager
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_reset_token,
    hash_password,
    hash_reset_token,
    verify_password,
)
from app.db.session import get_db
from app.db.models import Profile, Role, User
from app.schemas.user import (
    ProfileOut,
    ProfileUpdate,
    RegisterIn,
    LoginIn,
    ForgotPasswordIn,
    ResetPasswordIn,
)

router = APIRouter(prefix="/api", tags=["auth"])


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


@router.post("/auth/register", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, response: Response, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    name = payload.name.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Name is required.")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        if existing.password_hash:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        existing.password_hash = hash_password(payload.password)
        profile = existing.profile
        if profile:
            profile.name = name
            profile.email = email
        else:
            profile = Profile(user_id=existing.id, name=name, email=email, role=Role.WAREHOUSE_STAFF)
            db.add(profile)
    else:
        user = User(email=email, password_hash=hash_password(payload.password))
        db.add(user)
        db.flush()
        profile = Profile(user_id=user.id, name=name, email=email, role=Role.WAREHOUSE_STAFF)
        db.add(profile)

    db.commit()
    db.refresh(profile)
    _set_auth_cookie(response, create_access_token(profile.user_id))
    return profile


@router.post("/auth/login", response_model=ProfileOut)
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    profile = user.profile
    if not profile:
        raise HTTPException(status_code=500, detail="User profile is missing.")

    _set_auth_cookie(response, create_access_token(user.id))
    return profile


@router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(key=settings.AUTH_COOKIE_NAME, path="/")
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=ProfileOut)
def read_me(current_user: Profile = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=ProfileOut)
def update_profile(
    payload: ProfileUpdate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty.")
        current_user.name = name
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/auth/complete-signup", response_model=ProfileOut)
def complete_signup(
    payload: ProfileUpdate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.name is not None:
        current_user.name = payload.name.strip() or current_user.name
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/auth/forgot-password")
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    # Do not reveal whether an email exists.
    generic = {"message": "If an account exists, password reset instructions have been generated."}
    if not user:
        return generic

    raw_token, token_hash = create_reset_token()
    user.reset_token_hash = token_hash
    user.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
    db.commit()

    reset_url = f"{settings.CORS_ORIGINS.split(',')[0].strip()}/reset-password?token={raw_token}"

    if settings.SMTP_HOST and settings.SMTP_FROM_EMAIL:
        try:
            msg = EmailMessage()
            msg["Subject"] = "StockSense password reset"
            msg["From"] = settings.SMTP_FROM_EMAIL
            msg["To"] = email
            msg.set_content(
                f"Use this StockSense link to reset your password:\n\n{reset_url}\n\n"
                f"This link expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes."
            )
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
                smtp.starttls()
                if settings.SMTP_USERNAME:
                    smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                smtp.send_message(msg)
        except Exception:
            # Do not leak email infrastructure details to the user.
            pass
    elif settings.AUTH_DEBUG_RESET_LINK:
        return {**generic, "reset_token": raw_token, "reset_url": reset_url}

    return generic


@router.post("/auth/reset-password")
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)):
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    token_hash = hash_reset_token(payload.token)
    user = (
        db.query(User)
        .filter(User.reset_token_hash == token_hash)
        .first()
    )
    if not user or not user.reset_token_expires_at or user.reset_token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset link is invalid or expired.")

    user.password_hash = hash_password(payload.password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    db.commit()
    return {"message": "Password updated successfully."}


@router.get("/users", response_model=list[ProfileOut])
def list_users(db: Session = Depends(get_db), _: Profile = Depends(require_manager)):
    return db.query(Profile).order_by(Profile.name).all()


@router.patch("/users/{user_id}/role", response_model=ProfileOut)
def update_user_role(
    user_id: str,
    role: Role,
    db: Session = Depends(get_db),
    _: Profile = Depends(require_manager),
):
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if profile is None:
        raise HTTPException(status_code=404, detail="User not found.")
    profile.role = role
    db.commit()
    db.refresh(profile)
    return profile
