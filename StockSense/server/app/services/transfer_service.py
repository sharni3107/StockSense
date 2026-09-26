from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import InventoryOperation, OperationItem, OperationType, OperationStatus
from app.schemas.operation import TransferCreate
from app.services.inventory_service import generate_reference, apply_stock_change, get_or_create_stock, get_operation_or_404


def create_transfer(db: Session, payload: TransferCreate, created_by: str) -> InventoryOperation:
    if payload.source_location_id == payload.destination_location_id:
        raise HTTPException(status_code=422, detail="Source and destination locations must be different.")
    if not payload.items:
        raise HTTPException(status_code=422, detail="A transfer needs at least one product line.")

    for line in payload.items:
        stock = get_or_create_stock(db, line.product_id, payload.source_location_id)
        if stock.quantity < line.quantity:
            raise HTTPException(status_code=422, detail="Insufficient stock at the source location.")

    op = InventoryOperation(
        reference=generate_reference("TRF"),
        type=OperationType.TRANSFER,
        status=OperationStatus.WAITING,
        source_location_id=payload.source_location_id,
        destination_location_id=payload.destination_location_id,
        notes=payload.notes,
        created_by=created_by,
    )
    db.add(op)
    db.flush()

    for line in payload.items:
        db.add(OperationItem(operation_id=op.id, product_id=line.product_id, quantity=line.quantity))

    db.commit()
    db.refresh(op)
    return op


def validate_transfer(db: Session, operation_id: str, validated_by: str) -> InventoryOperation:
    op = get_operation_or_404(db, operation_id, OperationType.TRANSFER)
    if op.status == OperationStatus.DONE:
        raise HTTPException(status_code=422, detail="This transfer has already been validated.")
    if op.status == OperationStatus.CANCELED:
        raise HTTPException(status_code=422, detail="This transfer was canceled.")

    for item in op.items:
        apply_stock_change(
            db,
            product_id=item.product_id,
            location_id=op.source_location_id,
            delta=-item.quantity,
            operation_type=OperationType.TRANSFER,
            operation_id=op.id,
            created_by=validated_by,
            source_location_id=op.source_location_id,
            destination_location_id=op.destination_location_id,
        )
        apply_stock_change(
            db,
            product_id=item.product_id,
            location_id=op.destination_location_id,
            delta=item.quantity,
            operation_type=OperationType.TRANSFER,
            operation_id=op.id,
            created_by=validated_by,
            source_location_id=op.source_location_id,
            destination_location_id=op.destination_location_id,
        )
        item.processed_quantity = item.quantity

    op.status = OperationStatus.DONE
    op.validated_at = datetime.utcnow()
    db.commit()
    db.refresh(op)
    return op


def cancel_transfer(db: Session, operation_id: str) -> InventoryOperation:
    op = get_operation_or_404(db, operation_id, OperationType.TRANSFER)
    if op.status == OperationStatus.DONE:
        raise HTTPException(status_code=422, detail="A validated transfer cannot be canceled.")
    op.status = OperationStatus.CANCELED
    db.commit()
    db.refresh(op)
    return op
