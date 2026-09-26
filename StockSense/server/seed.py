"""
Seeds StockSense with demo data:
  1. Creates two local StockSense users (manager + warehouse staff).
  2. Creates matching `profiles` rows.
  3. Creates categories, products, warehouses, locations, stock, a validated
     receipt, a completed transfer, a completed delivery, a completed
     adjustment (each writing proper ledger entries), and two reordering
     rules - so the dashboard is meaningful immediately after setup.

Run once after applying supabase_schema.sql:
    python seed.py
"""
import sys


from app.core.config import settings
from app.db.session import SessionLocal, engine, Base
from app.db import models as m
from app.schemas.operation import ReceiptCreate, OperationItemIn, TransferCreate, DeliveryCreate
from app.services.receipt_service import create_receipt, validate_receipt
from app.services.transfer_service import create_transfer, validate_transfer
from app.services.delivery_service import create_delivery, validate_delivery
from app.core.security import hash_password

DEMO_MANAGER = {"email": "manager@stocksense.demo", "password": "StockSense123!", "name": "Priya Manager"}
DEMO_STAFF = {"email": "staff@stocksense.demo", "password": "StockSense123!", "name": "Arun Staff"}


def create_or_get_user(db, email: str, password: str, name: str, role):
    """Create/reuse a local StockSense authentication user."""
    user = db.query(m.User).filter(m.User.email == email).first()
    if not user:
        user = m.User(email=email, password_hash=hash_password(password))
        db.add(user)
        db.flush()
    elif not user.password_hash:
        user.password_hash = hash_password(password)

    profile = db.query(m.Profile).filter(m.Profile.user_id == user.id).first()
    if not profile:
        profile = m.Profile(user_id=user.id, name=name, email=email, role=role)
        db.add(profile)
    else:
        profile.name = name
        profile.email = email
        profile.role = role
    return profile


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    manager = create_or_get_user(
        db, DEMO_MANAGER["email"], DEMO_MANAGER["password"], DEMO_MANAGER["name"], m.Role.INVENTORY_MANAGER
    )
    staff = create_or_get_user(
        db, DEMO_STAFF["email"], DEMO_STAFF["password"], DEMO_STAFF["name"], m.Role.WAREHOUSE_STAFF
    )
    db.commit()
    db.refresh(manager)
    db.refresh(staff)

    if db.query(m.Category).count() > 0:
        print("Seed data already present - skipping inventory seed, users are ready.")
        print_summary()
        return

    raw_materials = m.Category(name="Raw Materials")
    hardware = m.Category(name="Hardware")
    furniture = m.Category(name="Furniture")
    db.add_all([raw_materials, hardware, furniture])
    db.flush()

    steel_rods = m.Product(name="Steel Rods", sku="STL-001", category_id=raw_materials.id, unit="kg", reorder_level=100)
    copper_wire = m.Product(name="Copper Wire", sku="CPR-002", category_id=raw_materials.id, unit="m", reorder_level=200)
    chairs = m.Product(name="Office Chairs", sku="CHR-003", category_id=furniture.id, unit="unit", reorder_level=10)
    bolts = m.Product(name="Bolts", sku="BLT-004", category_id=hardware.id, unit="box", reorder_level=20)
    sheets = m.Product(name="Aluminum Sheets", sku="ALU-005", category_id=raw_materials.id, unit="sheet", reorder_level=15)
    db.add_all([steel_rods, copper_wire, chairs, bolts, sheets])
    db.flush()

    main_wh = m.Warehouse(name="Main Warehouse", code="WH-MAIN", address="Plot 12, Industrial Estate")
    secondary_wh = m.Warehouse(name="Secondary Warehouse", code="WH-SEC", address="Sector 5, Logistics Park")
    db.add_all([main_wh, secondary_wh])
    db.flush()

    rack_a = m.Location(name="Rack A", code="RACK-A", warehouse_id=main_wh.id)
    rack_b = m.Location(name="Rack B", code="RACK-B", warehouse_id=main_wh.id)
    production_floor = m.Location(name="Production Floor", code="PROD", warehouse_id=main_wh.id)
    receiving = m.Location(name="Receiving Area", code="RECV", warehouse_id=main_wh.id)
    dispatch = m.Location(name="Dispatch Area", code="DISP", warehouse_id=main_wh.id)
    sec_rack = m.Location(name="Overflow Rack", code="OVF-A", warehouse_id=secondary_wh.id)
    db.add_all([rack_a, rack_b, production_floor, receiving, dispatch, sec_rack])
    db.flush()
    db.commit()

    def qty_on(product, location, quantity):
        stock = m.Stock(product_id=product.id, location_id=location.id, quantity=quantity)
        db.add(stock)

    qty_on(steel_rods, rack_a, 60)
    qty_on(copper_wire, rack_a, 340)
    qty_on(chairs, rack_b, 8)
    qty_on(bolts, rack_b, 5)
    qty_on(sheets, sec_rack, 22)
    db.commit()

    # A validated receipt: 50kg Steel Rods into Receiving Area.
    receipt = create_receipt(
        db,
        ReceiptCreate(
            partner_name="MetalCo Suppliers",
            destination_location_id=receiving.id,
            items=[OperationItemIn(product_id=steel_rods.id, quantity=50)],
        ),
        created_by=manager.id,
    )
    validate_receipt(db, receipt.id, validated_by=manager.id)

    # A validated internal transfer: 20kg Steel Rods, Receiving -> Production Floor.
    transfer = create_transfer(
        db,
        TransferCreate(
            source_location_id=receiving.id,
            destination_location_id=production_floor.id,
            items=[OperationItemIn(product_id=steel_rods.id, quantity=20)],
        ),
        created_by=staff.id,
    )
    validate_transfer(db, transfer.id, validated_by=staff.id)

    # A validated delivery: 6 Office Chairs shipped from Rack B.
    delivery = create_delivery(
        db,
        DeliveryCreate(
            partner_name="Bluewave Interiors",
            source_location_id=rack_b.id,
            items=[OperationItemIn(product_id=chairs.id, quantity=6)],
        ),
        created_by=manager.id,
    )
    from app.services.delivery_service import pick_item, pack_delivery

    for item in delivery.items:
        pick_item(db, delivery.id, item.id, item.quantity)
    pack_delivery(db, delivery.id)
    validate_delivery(db, delivery.id, validated_by=staff.id)

    # A pending receipt and pending transfer so the dashboards have "in progress" work too.
    create_receipt(
        db,
        ReceiptCreate(
            partner_name="Coastal Aluminum Ltd",
            destination_location_id=sec_rack.id,
            items=[OperationItemIn(product_id=sheets.id, quantity=30)],
        ),
        created_by=manager.id,
    )
    create_transfer(
        db,
        TransferCreate(
            source_location_id=rack_a.id,
            destination_location_id=production_floor.id,
            items=[OperationItemIn(product_id=copper_wire.id, quantity=40)],
        ),
        created_by=staff.id,
    )

    db.add(m.ReorderingRule(product_id=chairs.id, location_id=rack_b.id, min_qty=10, max_qty=40))
    db.add(m.ReorderingRule(product_id=bolts.id, location_id=rack_b.id, min_qty=15, max_qty=100))
    db.commit()

    print_summary()


def print_summary():
    print("\nSeed complete. Demo accounts:")
    print(f"  Inventory Manager -> {DEMO_MANAGER['email']} / {DEMO_MANAGER['password']}")
    print(f"  Warehouse Staff   -> {DEMO_STAFF['email']} / {DEMO_STAFF['password']}")


if __name__ == "__main__":
    main()
