from app.schemas.common import ORMBase


class WarehouseOut(ORMBase):
    id: str
    name: str
    code: str
    address: str | None = None
    location_count: int = 0


class WarehouseCreate(ORMBase):
    name: str
    code: str
    address: str | None = None


class WarehouseUpdate(ORMBase):
    name: str | None = None
    address: str | None = None


class LocationOut(ORMBase):
    id: str
    name: str
    code: str
    warehouse_id: str
    warehouse_name: str | None = None
    product_count: int = 0
    total_units: float = 0


class LocationCreate(ORMBase):
    name: str
    code: str
    warehouse_id: str


class LocationUpdate(ORMBase):
    name: str | None = None
    code: str | None = None
