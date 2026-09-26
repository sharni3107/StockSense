import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Float, Integer, ForeignKey, DateTime, Enum, UniqueConstraint, Text, Boolean
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


def gen_uuid():
    return str(uuid.uuid4())


class Role(str, enum.Enum):
    INVENTORY_MANAGER = "INVENTORY_MANAGER"
    WAREHOUSE_STAFF = "WAREHOUSE_STAFF"


class OperationType(str, enum.Enum):
    RECEIPT = "RECEIPT"
    DELIVERY = "DELIVERY"
    TRANSFER = "TRANSFER"
    ADJUSTMENT = "ADJUSTMENT"


class OperationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    WAITING = "WAITING"
    READY = "READY"
    DONE = "DONE"
    CANCELED = "CANCELED"


class User(Base):
    """StockSense authentication identity. Supabase is only the PostgreSQL host."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    reset_token_hash = Column(String, nullable=True, unique=True, index=True)
    reset_token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Profile(Base):
    """Application profile associated with a local StockSense User."""
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(Enum(Role, name="role_enum"), nullable=False, default=Role.WAREHOUSE_STAFF)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")
    operations = relationship("InventoryOperation", back_populates="created_by_profile")
    ledger_entries = relationship("StockLedger", back_populates="created_by_profile")


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, nullable=False, index=True)
    category_id = Column(UUID(as_uuid=False), ForeignKey("categories.id"), nullable=False)
    unit = Column(String, nullable=False, default="unit")
    reorder_level = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    stocks = relationship("Stock", back_populates="product")
    operation_items = relationship("OperationItem", back_populates="product")
    ledger_entries = relationship("StockLedger", back_populates="product")
    reordering_rules = relationship("ReorderingRule", back_populates="product")


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    locations = relationship("Location", back_populates="warehouse")


class Location(Base):
    __tablename__ = "locations"
    __table_args__ = (UniqueConstraint("warehouse_id", "code", name="uq_location_warehouse_code"),)

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    warehouse_id = Column(UUID(as_uuid=False), ForeignKey("warehouses.id"), nullable=False)

    warehouse = relationship("Warehouse", back_populates="locations")
    stocks = relationship("Stock", back_populates="location")
    reordering_rules = relationship("ReorderingRule", back_populates="location")


class Stock(Base):
    __tablename__ = "stock"
    __table_args__ = (UniqueConstraint("product_id", "location_id", name="uq_stock_product_location"),)

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    product_id = Column(UUID(as_uuid=False), ForeignKey("products.id"), nullable=False)
    location_id = Column(UUID(as_uuid=False), ForeignKey("locations.id"), nullable=False)
    quantity = Column(Float, nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="stocks")
    location = relationship("Location", back_populates="stocks")


class InventoryOperation(Base):
    __tablename__ = "inventory_operations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    reference = Column(String, unique=True, nullable=False)
    type = Column(Enum(OperationType, name="operation_type_enum"), nullable=False)
    status = Column(Enum(OperationStatus, name="operation_status_enum"), nullable=False, default=OperationStatus.DRAFT)
    partner_name = Column(String, nullable=True)  # supplier or customer name
    source_location_id = Column(UUID(as_uuid=False), ForeignKey("locations.id"), nullable=True)
    destination_location_id = Column(UUID(as_uuid=False), ForeignKey("locations.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    validated_at = Column(DateTime, nullable=True)

    source_location = relationship("Location", foreign_keys=[source_location_id])
    destination_location = relationship("Location", foreign_keys=[destination_location_id])
    created_by_profile = relationship("Profile", back_populates="operations")
    items = relationship("OperationItem", back_populates="operation", cascade="all, delete-orphan")
    ledger_entries = relationship("StockLedger", back_populates="operation")


class OperationItem(Base):
    __tablename__ = "operation_items"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    operation_id = Column(UUID(as_uuid=False), ForeignKey("inventory_operations.id"), nullable=False)
    product_id = Column(UUID(as_uuid=False), ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    processed_quantity = Column(Float, nullable=False, default=0)  # picked/received so far

    operation = relationship("InventoryOperation", back_populates="items")
    product = relationship("Product", back_populates="operation_items")


class StockLedger(Base):
    __tablename__ = "stock_ledger"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    product_id = Column(UUID(as_uuid=False), ForeignKey("products.id"), nullable=False)
    operation_id = Column(UUID(as_uuid=False), ForeignKey("inventory_operations.id"), nullable=True)
    source_location_id = Column(UUID(as_uuid=False), ForeignKey("locations.id"), nullable=True)
    destination_location_id = Column(UUID(as_uuid=False), ForeignKey("locations.id"), nullable=True)
    quantity_change = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    operation_type = Column(Enum(OperationType, name="ledger_operation_type_enum"), nullable=False)
    created_by = Column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="ledger_entries")
    operation = relationship("InventoryOperation", back_populates="ledger_entries")
    source_location = relationship("Location", foreign_keys=[source_location_id])
    destination_location = relationship("Location", foreign_keys=[destination_location_id])
    created_by_profile = relationship("Profile", back_populates="ledger_entries")


class ReorderingRule(Base):
    __tablename__ = "reordering_rules"
    __table_args__ = (UniqueConstraint("product_id", "location_id", name="uq_rule_product_location"),)

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    product_id = Column(UUID(as_uuid=False), ForeignKey("products.id"), nullable=False)
    location_id = Column(UUID(as_uuid=False), ForeignKey("locations.id"), nullable=False)
    min_qty = Column(Float, nullable=False, default=0)
    max_qty = Column(Float, nullable=False, default=0)

    product = relationship("Product", back_populates="reordering_rules")
    location = relationship("Location", back_populates="reordering_rules")
