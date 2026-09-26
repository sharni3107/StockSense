import random
import string
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Stock, StockLedger, OperationType, InventoryOperation


def generate_reference(prefix: str) -> str:
    suffix = "".join(random.choices(string.digits, k=5))
    return f"{prefix}-{datetime.utcnow().strftime('%y%m')}-{suffix}"


def get_or_create_stock(db: Session, product_id: str, location_id: str) -> Stock:
    stock = (
        db.query(Stock)
        .filter(Stock.product_id == product_id, Stock.location_id == location_id)
        .first()
    )
    if stock is None:
        stock = Stock(product_id=product_id, location_id=location_id, quantity=0)
        db.add(stock)
        db.flush()
    return stock


def get_total_stock(db: Session, product_id: str) -> float:
    rows = db.query(Stock).filter(Stock.product_id == product_id).all()
    return sum(r.quantity for r in rows)


def apply_stock_change(
    db: Session,
    *,
    product_id: str,
    location_id: str | None,
    delta: float,
    operation_type: OperationType,
    operation_id: str | None,
    created_by: str | None,
    source_location_id: str | None = None,
    destination_location_id: str | None = None,
) -> float:
    """
    Applies `delta` to the stock row for (product, location) and writes a
    matching, immutable stock_ledger entry. Caller controls the DB
    transaction boundary (commit/rollback) - this function only flushes.
    """
    if location_id is None:
        raise HTTPException(status_code=422, detail="A location is required for this stock change.")

    stock = get_or_create_stock(db, product_id, location_id)
    new_qty = stock.quantity + delta

    if new_qty < 0 and not settings.ALLOW_NEGATIVE_STOCK:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Insufficient stock at the source location for this operation.",
        )

    stock.quantity = new_qty
    db.flush()

    ledger = StockLedger(
        product_id=product_id,
        operation_id=operation_id,
        source_location_id=source_location_id,
        destination_location_id=destination_location_id,
        quantity_change=delta,
        balance_after=new_qty,
        operation_type=operation_type,
        created_by=created_by,
    )
    db.add(ledger)
    db.flush()
    return new_qty


def stock_status_for(total_stock: float, reorder_level: float) -> str:
    if total_stock <= 0:
        return "out"
    if reorder_level and total_stock <= reorder_level:
        return "low"
    return "healthy"


def get_operation_or_404(db: Session, operation_id: str, expected_type: OperationType) -> InventoryOperation:
    op = (
        db.query(InventoryOperation)
        .filter(InventoryOperation.id == operation_id, InventoryOperation.type == expected_type)
        .first()
    )
    if op is None:
        raise HTTPException(status_code=404, detail="Operation not found.")
    return op
