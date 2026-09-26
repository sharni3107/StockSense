from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import InventoryOperation, OperationItem, OperationType, OperationStatus
from app.schemas.operation import DeliveryCreate
from app.services.inventory_service import generate_reference, apply_stock_change, get_operation_or_404, get_or_create_stock


def create_delivery(db: Session, payload: DeliveryCreate, created_by: str) -> InventoryOperation:
    if not payload.items:
        raise HTTPException(status_code=422, detail="A delivery needs at least one product line.")

    op = InventoryOperation(
        reference=generate_reference("DEL"),
        type=OperationType.DELIVERY,
        status=OperationStatus.DRAFT,
        partner_name=payload.partner_name,
        source_location_id=payload.source_location_id,
        notes=payload.notes,
        created_by=created_by,
    )
    db.add(op)
    db.flush()

    for line in payload.items:
        stock = get_or_create_stock(db, line.product_id, payload.source_location_id)
        if stock.quantity < line.quantity:
            raise HTTPException(
                status_code=422,
                detail=f"Not enough stock at the source location to reserve {line.quantity} units.",
            )
        db.add(OperationItem(operation_id=op.id, product_id=line.product_id, quantity=line.quantity))

    op.status = OperationStatus.WAITING
    db.commit()
    db.refresh(op)
    return op


def pick_item(db: Session, operation_id: str, item_id: str, quantity: float) -> InventoryOperation:
    op = get_operation_or_404(db, operation_id, OperationType.DELIVERY)
    item = next((i for i in op.items if i.id == item_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Line item not found on this delivery.")
    item.processed_quantity = min(item.quantity, item.processed_quantity + quantity)
    if op.status == OperationStatus.WAITING:
        op.status = OperationStatus.READY
    db.commit()
    db.refresh(op)
    return op


def pack_delivery(db: Session, operation_id: str) -> InventoryOperation:
    op = get_operation_or_404(db, operation_id, OperationType.DELIVERY)
    if any(i.processed_quantity < i.quantity for i in op.items):
        raise HTTPException(status_code=422, detail="Every line must be fully picked before packing.")
    op.status = OperationStatus.READY
    db.commit()
    db.refresh(op)
    return op


def validate_delivery(db: Session, operation_id: str, validated_by: str) -> InventoryOperation:
    op = get_operation_or_404(db, operation_id, OperationType.DELIVERY)
    if op.status == OperationStatus.DONE:
        raise HTTPException(status_code=422, detail="This delivery has already been validated.")
    if op.status == OperationStatus.CANCELED:
        raise HTTPException(status_code=422, detail="This delivery was canceled.")

    for item in op.items:
        apply_stock_change(
            db,
            product_id=item.product_id,
            location_id=op.source_location_id,
            delta=-item.quantity,
            operation_type=OperationType.DELIVERY,
            operation_id=op.id,
            created_by=validated_by,
            source_location_id=op.source_location_id,
        )

    op.status = OperationStatus.DONE
    op.validated_at = datetime.utcnow()
    db.commit()
    db.refresh(op)
    return op


def cancel_delivery(db: Session, operation_id: str) -> InventoryOperation:
    op = get_operation_or_404(db, operation_id, OperationType.DELIVERY)
    if op.status == OperationStatus.DONE:
        raise HTTPException(status_code=422, detail="A validated delivery cannot be canceled.")
    op.status = OperationStatus.CANCELED
    db.commit()
    db.refresh(op)
    return op
