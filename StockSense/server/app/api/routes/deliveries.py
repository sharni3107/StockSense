from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_any_role
from app.db.session import get_db
from app.db.models import InventoryOperation, OperationType, Profile
from app.schemas.operation import DeliveryCreate, OperationOut, PickPackIn
from app.services.delivery_service import (
    create_delivery, pick_item, pack_delivery, validate_delivery, cancel_delivery
)
from app.api.routes._operation_serializer import serialize_operation

router = APIRouter(prefix="/api/deliveries", tags=["deliveries"])


@router.get("", response_model=list[OperationOut])
def list_deliveries(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    ops = (
        db.query(InventoryOperation)
        .filter(InventoryOperation.type == OperationType.DELIVERY)
        .order_by(InventoryOperation.created_at.desc())
        .all()
    )
    return [serialize_operation(o) for o in ops]


@router.get("/{operation_id}", response_model=OperationOut)
def get_delivery(operation_id: str, db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    op = db.query(InventoryOperation).filter(InventoryOperation.id == operation_id).first()
    return serialize_operation(op)


@router.post("", response_model=OperationOut)
def create(payload: DeliveryCreate, db: Session = Depends(get_db), user: Profile = Depends(require_any_role)):
    op = create_delivery(db, payload, created_by=user.id)
    return serialize_operation(op)


@router.post("/{operation_id}/pick", response_model=OperationOut)
def pick(operation_id: str, payload: PickPackIn, db: Session = Depends(get_db), _: Profile = Depends(require_any_role)):
    op = pick_item(db, operation_id, payload.item_id, payload.quantity)
    return serialize_operation(op)


@router.post("/{operation_id}/pack", response_model=OperationOut)
def pack(operation_id: str, db: Session = Depends(get_db), _: Profile = Depends(require_any_role)):
    op = pack_delivery(db, operation_id)
    return serialize_operation(op)


@router.post("/{operation_id}/validate", response_model=OperationOut)
def validate(operation_id: str, db: Session = Depends(get_db), user: Profile = Depends(require_any_role)):
    op = validate_delivery(db, operation_id, validated_by=user.id)
    return serialize_operation(op)


@router.post("/{operation_id}/cancel", response_model=OperationOut)
def cancel(operation_id: str, db: Session = Depends(get_db), _: Profile = Depends(require_any_role)):
    op = cancel_delivery(db, operation_id)
    return serialize_operation(op)
