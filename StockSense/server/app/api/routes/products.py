from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_manager
from app.db.session import get_db
from app.db.models import Product, Category, Stock, Location, Warehouse, Profile
from app.schemas.product import ProductOut, ProductCreate, ProductUpdate, ProductDetailOut, StockByLocationOut
from app.services.inventory_service import get_total_stock, stock_status_for, get_or_create_stock

router = APIRouter(prefix="/api/products", tags=["products"])


def _to_out(db: Session, p: Product) -> ProductOut:
    total = get_total_stock(db, p.id)
    return ProductOut(
        id=p.id,
        name=p.name,
        sku=p.sku,
        category_id=p.category_id,
        category_name=p.category.name if p.category else None,
        unit=p.unit,
        reorder_level=p.reorder_level,
        total_stock=total,
        stock_status=stock_status_for(total, p.reorder_level),
        created_at=p.created_at,
    )


@router.get("", response_model=list[ProductOut])
def list_products(
    search: str | None = Query(None),
    category_id: str | None = Query(None),
    stock_status: str | None = Query(None, description="healthy | low | out"),
    db: Session = Depends(get_db),
    _: Profile = Depends(get_current_user),
):
    q = db.query(Product)
    if search:
        like = f"%{search}%"
        q = q.filter((Product.name.ilike(like)) | (Product.sku.ilike(like)))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    products = q.order_by(Product.name).all()
    results = [_to_out(db, p) for p in products]
    if stock_status:
        results = [r for r in results if r.stock_status == stock_status]
    return results


@router.get("/{product_id}", response_model=ProductDetailOut)
def get_product(product_id: str, db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if p is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    base = _to_out(db, p)
    rows = (
        db.query(Stock, Location, Warehouse)
        .join(Location, Location.id == Stock.location_id)
        .join(Warehouse, Warehouse.id == Location.warehouse_id)
        .filter(Stock.product_id == product_id, Stock.quantity != 0)
        .all()
    )
    by_location = [
        StockByLocationOut(
            location_id=loc.id, location_name=loc.name, warehouse_name=wh.name, quantity=stock.quantity
        )
        for stock, loc, wh in rows
    ]
    return ProductDetailOut(**base.model_dump(), stock_by_location=by_location)


@router.post("", response_model=ProductOut)
def create_product(payload: ProductCreate, db: Session = Depends(get_db), _: Profile = Depends(require_manager)):
    if db.query(Product).filter(Product.sku == payload.sku).first():
        raise HTTPException(status_code=409, detail="A product with this SKU already exists.")
    if not db.query(Category).filter(Category.id == payload.category_id).first():
        raise HTTPException(status_code=422, detail="Selected category does not exist.")

    product = Product(
        name=payload.name,
        sku=payload.sku,
        category_id=payload.category_id,
        unit=payload.unit,
        reorder_level=payload.reorder_level,
    )
    db.add(product)
    db.flush()

    if payload.initial_stock and payload.initial_location_id:
        stock = get_or_create_stock(db, product.id, payload.initial_location_id)
        stock.quantity = payload.initial_stock

    db.commit()
    db.refresh(product)
    return _to_out(db, product)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str, payload: ProductUpdate, db: Session = Depends(get_db), _: Profile = Depends(require_manager)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return _to_out(db, product)


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: str, db: Session = Depends(get_db), _: Profile = Depends(require_manager)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    total = get_total_stock(db, product_id)
    if total != 0:
        raise HTTPException(status_code=422, detail="Cannot delete a product that still has stock on hand.")
    db.delete(product)
    db.commit()
