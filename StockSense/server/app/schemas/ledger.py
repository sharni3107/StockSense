from datetime import datetime
from app.schemas.common import ORMBase, OperationType


class LedgerEntryOut(ORMBase):
    id: str
    created_at: datetime
    product_id: str
    product_name: str | None = None
    sku: str | None = None
    operation_id: str | None = None
    reference: str | None = None
    operation_type: OperationType
    quantity_change: float
    balance_after: float
    source_location_name: str | None = None
    destination_location_name: str | None = None
    created_by_name: str | None = None


class ReorderRuleOut(ORMBase):
    id: str
    product_id: str
    product_name: str | None = None
    sku: str | None = None
    location_id: str
    location_name: str | None = None
    min_qty: float
    max_qty: float
    current_stock: float = 0
    status: str = "healthy"  # healthy | needs_reorder | critical


class ReorderRuleCreate(ORMBase):
    product_id: str
    location_id: str
    min_qty: float
    max_qty: float


class ReorderRuleUpdate(ORMBase):
    min_qty: float | None = None
    max_qty: float | None = None


class DashboardSummaryOut(ORMBase):
    total_stock_units: float = 0
    low_stock_count: int = 0
    out_of_stock_count: int = 0
    pending_receipts: int = 0
    pending_deliveries: int = 0
    scheduled_transfers: int = 0


class TaskCountsOut(ORMBase):
    picking_tasks: int = 0
    pending_receipts: int = 0
    pending_transfers: int = 0
    stock_counts: int = 0
