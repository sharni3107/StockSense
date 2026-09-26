from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_any_role
from app.db.session import get_db
from app.db.models import InventoryOperation, OperationType, Profile
from app.schemas.operation import ReceiptCreate, OperationOut
from app.services.receipt_service import create_receipt, validate_receipt, cancel_receipt
from app.api.routes._operation_serializer import serialize_operation

router = APIRouter(prefix="/api/receipts", tags=["receipts"])


@router.get("", response_model=list[OperationOut])
def list_receipts(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    ops = (
        db.query(InventoryOperation)
        .filter(InventoryOperation.type == OperationType.RECEIPT)
        .order_by(InventoryOperation.created_at.desc())
        .all()
    )
    return [serialize_operation(o) for o in ops]


@router.get("/{operation_id}", response_model=OperationOut)
def get_receipt(operation_id: str, db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    op = db.query(InventoryOperation).filter(InventoryOperation.id == operation_id).first()
    return serialize_operation(op)


@router.post("", response_model=OperationOut)
def create(payload: ReceiptCreate, db: Session = Depends(get_db), user: Profile = Depends(require_any_role)):
    op = create_receipt(db, payload, created_by=user.id)
    return serialize_operation(op)


@router.post("/{operation_id}/validate", response_model=OperationOut)
def validate(operation_id: str, db: Session = Depends(get_db), user: Profile = Depends(require_any_role)):
    op = validate_receipt(db, operation_id, validated_by=user.id)
    return serialize_operation(op)


@router.post("/{operation_id}/cancel", response_model=OperationOut)
def cancel(operation_id: str, db: Session = Depends(get_db), _: Profile = Depends(require_any_role)):
    op = cancel_receipt(db, operation_id)
    return serialize_operation(op)
