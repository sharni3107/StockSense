from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_any_role
from app.db.session import get_db
from app.db.models import InventoryOperation, OperationType, Profile
from app.schemas.operation import AdjustmentCreate, OperationOut
from app.services.adjustment_service import create_and_validate_adjustment
from app.api.routes._operation_serializer import serialize_operation

router = APIRouter(prefix="/api/adjustments", tags=["adjustments"])


@router.get("", response_model=list[OperationOut])
def list_adjustments(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    ops = (
        db.query(InventoryOperation)
        .filter(InventoryOperation.type == OperationType.ADJUSTMENT)
        .order_by(InventoryOperation.created_at.desc())
        .all()
    )
    return [serialize_operation(o) for o in ops]


@router.post("", response_model=OperationOut)
def create(payload: AdjustmentCreate, db: Session = Depends(get_db), user: Profile = Depends(require_any_role)):
    op = create_and_validate_adjustment(db, payload, created_by=user.id)
    return serialize_operation(op)
