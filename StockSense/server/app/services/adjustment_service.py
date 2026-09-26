from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import InventoryOperation, OperationItem, OperationType, OperationStatus
from app.schemas.operation import AdjustmentCreate
from app.services.inventory_service import generate_reference, apply_stock_change, get_or_create_stock


def create_and_validate_adjustment(db: Session, payload: AdjustmentCreate, created_by: str) -> InventoryOperation:
    """
    Adjustments are recorded and applied in one step: the manager/staff member
    enters the physical count, the system computes the difference immediately.
    """
    if not payload.lines:
        raise HTTPException(status_code=422, detail="An adjustment needs at least one counted line.")

    op = InventoryOperation(
        reference=generate_reference("ADJ"),
        type=OperationType.ADJUSTMENT,
        status=OperationStatus.DONE,
        notes=payload.notes,
        created_by=created_by,
        validated_at=datetime.utcnow(),
    )
    db.add(op)
    db.flush()

    for line in payload.lines:
        stock = get_or_create_stock(db, line.product_id, line.location_id)
        system_qty = stock.quantity
        difference = line.physical_quantity - system_qty

        db.add(
            OperationItem(
                operation_id=op.id,
                product_id=line.product_id,
                quantity=difference,
                processed_quantity=difference,
            )
        )

        if difference != 0:
            apply_stock_change(
                db,
                product_id=line.product_id,
                location_id=line.location_id,
                delta=difference,
                operation_type=OperationType.ADJUSTMENT,
                operation_id=op.id,
                created_by=created_by,
                source_location_id=line.location_id,
            )

    db.commit()
    db.refresh(op)
    return op
