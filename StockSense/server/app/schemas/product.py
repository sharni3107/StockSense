from datetime import datetime
from app.schemas.common import ORMBase


class CategoryOut(ORMBase):
    id: str
    name: str
    product_count: int = 0
    stock_units: float = 0


class CategoryCreate(ORMBase):
    name: str


class CategoryUpdate(ORMBase):
    name: str


class StockByLocationOut(ORMBase):
    location_id: str
    location_name: str
    warehouse_name: str
    quantity: float


class ProductOut(ORMBase):
    id: str
    name: str
    sku: str
    category_id: str
    category_name: str | None = None
    unit: str
    reorder_level: float
    total_stock: float = 0
    stock_status: str = "healthy"  # healthy | low | out
    created_at: datetime


class ProductDetailOut(ProductOut):
    stock_by_location: list[StockByLocationOut] = []


class ProductCreate(ORMBase):
    name: str
    sku: str
    category_id: str
    unit: str = "unit"
    reorder_level: float = 0
    initial_stock: float | None = None
    initial_location_id: str | None = None


class ProductUpdate(ORMBase):
    name: str | None = None
    category_id: str | None = None
    unit: str | None = None
    reorder_level: float | None = None
