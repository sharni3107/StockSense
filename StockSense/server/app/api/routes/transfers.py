from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_any_role
from app.db.session import get_db
from app.db.models import InventoryOperation, OperationType, Profile
from app.schemas.operation import TransferCreate, OperationOut
from app.services.transfer_service import create_transfer, validate_transfer, cancel_transfer
from app.api.routes._operation_serializer import serialize_operation

router = APIRouter(prefix="/api/transfers", tags=["transfers"])


@router.get("", response_model=list[OperationOut])
def list_transfers(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    ops = (
        db.query(InventoryOperation)
        .filter(InventoryOperation.type == OperationType.TRANSFER)
        .order_by(InventoryOperation.created_at.desc())
        .all()
    )
    return [serialize_operation(o) for o in ops]


@router.post("", response_model=OperationOut)
def create(payload: TransferCreate, db: Session = Depends(get_db), user: Profile = Depends(require_any_role)):
    op = create_transfer(db, payload, created_by=user.id)
    return serialize_operation(op)


@router.post("/{operation_id}/validate", response_model=OperationOut)
def validate(operation_id: str, db: Session = Depends(get_db), user: Profile = Depends(require_any_role)):
    op = validate_transfer(db, operation_id, validated_by=user.id)
    return serialize_operation(op)


@router.post("/{operation_id}/cancel", response_model=OperationOut)
def cancel(operation_id: str, db: Session = Depends(get_db), _: Profile = Depends(require_any_role)):
    op = cancel_transfer(db, operation_id)
    return serialize_operation(op)
