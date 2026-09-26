from datetime import datetime
from app.schemas.common import ORMBase, OperationType, OperationStatus


class OperationItemIn(ORMBase):
    product_id: str
    quantity: float


class OperationItemOut(ORMBase):
    id: str
    product_id: str
    product_name: str | None = None
    sku: str | None = None
    quantity: float
    processed_quantity: float = 0


class OperationOut(ORMBase):
    id: str
    reference: str
    type: OperationType
    status: OperationStatus
    partner_name: str | None = None
    source_location_id: str | None = None
    source_location_name: str | None = None
    destination_location_id: str | None = None
    destination_location_name: str | None = None
    notes: str | None = None
    created_at: datetime
    validated_at: datetime | None = None
    items: list[OperationItemOut] = []


class ReceiptCreate(ORMBase):
    partner_name: str  # supplier
    destination_location_id: str
    notes: str | None = None
    items: list[OperationItemIn]


class DeliveryCreate(ORMBase):
    partner_name: str  # customer
    source_location_id: str
    notes: str | None = None
    items: list[OperationItemIn]


class TransferCreate(ORMBase):
    source_location_id: str
    destination_location_id: str
    notes: str | None = None
    items: list[OperationItemIn]


class AdjustmentLineIn(ORMBase):
    product_id: str
    location_id: str
    physical_quantity: float


class AdjustmentCreate(ORMBase):
    notes: str | None = None
    lines: list[AdjustmentLineIn]


class PickPackIn(ORMBase):
    item_id: str
    quantity: float
