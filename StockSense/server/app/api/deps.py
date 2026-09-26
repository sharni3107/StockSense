from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_access_token, InvalidTokenError
from app.core.config import settings
from app.db.session import get_db
from app.db.models import Profile, Role

bearer_scheme = HTTPBearer(auto_error=False)


def _profile_from_token(token_value: str, db: Session) -> Profile:
    try:
        user_id = decode_access_token(token_value)
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User profile not found.")
    return profile


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Profile:
    """Accept the browser's HTTP-only JWT cookie or an Authorization bearer token."""
    token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    if not token and credentials:
        token = credentials.credentials
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication token.")
    return _profile_from_token(token, db)


def require_role(*allowed_roles: Role):
    def dependency(current_user: Profile = Depends(get_current_user)) -> Profile:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return dependency


require_manager = require_role(Role.INVENTORY_MANAGER)
require_any_role = require_role(Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF)
