from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.db.models import Product, Stock, InventoryOperation, OperationType, OperationStatus, Profile
from app.schemas.ledger import DashboardSummaryOut, TaskCountsOut
from app.schemas.product import ProductOut
from app.schemas.operation import OperationOut
from app.services.inventory_service import get_total_stock, stock_status_for
from app.api.routes._operation_serializer import serialize_operation

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryOut)
def summary(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    total_units = db.query(func.coalesce(func.sum(Stock.quantity), 0)).scalar() or 0

    low = out = 0
    for p in db.query(Product).all():
        total = get_total_stock(db, p.id)
        status = stock_status_for(total, p.reorder_level)
        if status == "low":
            low += 1
        elif status == "out":
            out += 1

    def pending(op_type: OperationType) -> int:
        return (
            db.query(func.count(InventoryOperation.id))
            .filter(
                InventoryOperation.type == op_type,
                InventoryOperation.status.in_([OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY]),
            )
            .scalar()
            or 0
        )

    return DashboardSummaryOut(
        total_stock_units=total_units,
        low_stock_count=low,
        out_of_stock_count=out,
        pending_receipts=pending(OperationType.RECEIPT),
        pending_deliveries=pending(OperationType.DELIVERY),
        scheduled_transfers=pending(OperationType.TRANSFER),
    )


@router.get("/low-stock", response_model=list[ProductOut])
def low_stock(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    from app.api.routes.products import _to_out

    results = [_to_out(db, p) for p in db.query(Product).all()]
    return [r for r in results if r.stock_status in ("low", "out")]


@router.get("/activity", response_model=list[OperationOut])
def recent_activity(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    ops = db.query(InventoryOperation).order_by(InventoryOperation.created_at.desc()).limit(10).all()
    return [serialize_operation(o) for o in ops]


@router.get("/pending-receipts", response_model=list[OperationOut])
def pending_receipts(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    ops = (
        db.query(InventoryOperation)
        .filter(
            InventoryOperation.type == OperationType.RECEIPT,
            InventoryOperation.status.in_([OperationStatus.DRAFT, OperationStatus.WAITING]),
        )
        .order_by(InventoryOperation.created_at.desc())
        .limit(10)
        .all()
    )
    return [serialize_operation(o) for o in ops]


@router.get("/pending-deliveries", response_model=list[OperationOut])
def pending_deliveries(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    ops = (
        db.query(InventoryOperation)
        .filter(
            InventoryOperation.type == OperationType.DELIVERY,
            InventoryOperation.status.in_([OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY]),
        )
        .order_by(InventoryOperation.created_at.desc())
        .limit(10)
        .all()
    )
    return [serialize_operation(o) for o in ops]


@router.get("/my-tasks", response_model=TaskCountsOut)
def my_tasks(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    def count(op_type: OperationType) -> int:
        return (
            db.query(func.count(InventoryOperation.id))
            .filter(
                InventoryOperation.type == op_type,
                InventoryOperation.status.in_([OperationStatus.WAITING, OperationStatus.READY]),
            )
            .scalar()
            or 0
        )

    return TaskCountsOut(
        picking_tasks=count(OperationType.DELIVERY),
        pending_receipts=count(OperationType.RECEIPT),
        pending_transfers=count(OperationType.TRANSFER),
        stock_counts=0,
    )


@router.get("/task-list", response_model=list[OperationOut])
def task_list(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    ops = (
        db.query(InventoryOperation)
        .filter(
            InventoryOperation.type.in_([OperationType.RECEIPT, OperationType.DELIVERY, OperationType.TRANSFER]),
            InventoryOperation.status.in_([OperationStatus.WAITING, OperationStatus.READY]),
        )
        .order_by(InventoryOperation.created_at.asc())
        .limit(20)
        .all()
    )
    return [serialize_operation(o) for o in ops]
