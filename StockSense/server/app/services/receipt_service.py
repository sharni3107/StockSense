from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import InventoryOperation, OperationItem, OperationType, OperationStatus
from app.schemas.operation import ReceiptCreate
from app.services.inventory_service import generate_reference, apply_stock_change, get_operation_or_404


def create_receipt(db: Session, payload: ReceiptCreate, created_by: str) -> InventoryOperation:
    if not payload.items:
        raise HTTPException(status_code=422, detail="A receipt needs at least one product line.")

    op = InventoryOperation(
        reference=generate_reference("REC"),
        type=OperationType.RECEIPT,
        status=OperationStatus.DRAFT,
        partner_name=payload.partner_name,
        destination_location_id=payload.destination_location_id,
        notes=payload.notes,
        created_by=created_by,
    )
    db.add(op)
    db.flush()

    for line in payload.items:
        db.add(OperationItem(operation_id=op.id, product_id=line.product_id, quantity=line.quantity))

    op.status = OperationStatus.WAITING
    db.commit()
    db.refresh(op)
    return op


def validate_receipt(db: Session, operation_id: str, validated_by: str) -> InventoryOperation:
    op = get_operation_or_404(db, operation_id, OperationType.RECEIPT)
    if op.status == OperationStatus.DONE:
        raise HTTPException(status_code=422, detail="This receipt has already been validated.")
    if op.status == OperationStatus.CANCELED:
        raise HTTPException(status_code=422, detail="This receipt was canceled.")

    from datetime import datetime

    for item in op.items:
        apply_stock_change(
            db,
            product_id=item.product_id,
            location_id=op.destination_location_id,
            delta=item.quantity,
            operation_type=OperationType.RECEIPT,
            operation_id=op.id,
            created_by=validated_by,
            destination_location_id=op.destination_location_id,
        )
        item.processed_quantity = item.quantity

    op.status = OperationStatus.DONE
    op.validated_at = datetime.utcnow()
    db.commit()
    db.refresh(op)
    return op


def cancel_receipt(db: Session, operation_id: str) -> InventoryOperation:
    op = get_operation_or_404(db, operation_id, OperationType.RECEIPT)
    if op.status == OperationStatus.DONE:
        raise HTTPException(status_code=422, detail="A validated receipt cannot be canceled.")
    op.status = OperationStatus.CANCELED
    db.commit()
    db.refresh(op)
    return op
