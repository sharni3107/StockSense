from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.db.models import StockLedger, Profile
from app.schemas.ledger import LedgerEntryOut

router = APIRouter(prefix="/api/ledger", tags=["ledger"])


@router.get("", response_model=list[LedgerEntryOut])
def list_ledger(
    product_id: str | None = Query(None),
    warehouse_id: str | None = Query(None),
    operation_type: str | None = Query(None),
    search: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    limit: int = Query(200, le=1000),
    db: Session = Depends(get_db),
    _: Profile = Depends(get_current_user),
):
    q = db.query(StockLedger)
    if product_id:
        q = q.filter(StockLedger.product_id == product_id)
    if operation_type:
        q = q.filter(StockLedger.operation_type == operation_type)
    if date_from:
        q = q.filter(StockLedger.created_at >= date_from)
    if date_to:
        q = q.filter(StockLedger.created_at <= date_to)

    entries = q.order_by(StockLedger.created_at.desc()).limit(limit).all()

    if warehouse_id:
        entries = [
            e
            for e in entries
            if (e.source_location and e.source_location.warehouse_id == warehouse_id)
            or (e.destination_location and e.destination_location.warehouse_id == warehouse_id)
        ]
    if search:
        needle = search.lower()
        entries = [
            e
            for e in entries
            if needle in (e.product.name.lower() if e.product else "")
            or needle in (e.product.sku.lower() if e.product else "")
            or (e.operation and needle in e.operation.reference.lower())
        ]

    return [
        LedgerEntryOut(
            id=e.id,
            created_at=e.created_at,
            product_id=e.product_id,
            product_name=e.product.name if e.product else None,
            sku=e.product.sku if e.product else None,
            operation_id=e.operation_id,
            reference=e.operation.reference if e.operation else None,
            operation_type=e.operation_type,
            quantity_change=e.quantity_change,
            balance_after=e.balance_after,
            source_location_name=e.source_location.name if e.source_location else None,
            destination_location_name=e.destination_location.name if e.destination_location else None,
            created_by_name=e.created_by_profile.name if e.created_by_profile else None,
        )
        for e in entries
    ]
