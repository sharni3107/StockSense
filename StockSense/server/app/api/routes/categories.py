from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_manager
from app.db.session import get_db
from app.db.models import Category, Product, Stock, Profile
from app.schemas.product import CategoryOut, CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["categories"])


def _to_out(db: Session, cat: Category) -> CategoryOut:
    product_count = db.query(func.count(Product.id)).filter(Product.category_id == cat.id).scalar() or 0
    stock_units = (
        db.query(func.coalesce(func.sum(Stock.quantity), 0))
        .join(Product, Product.id == Stock.product_id)
        .filter(Product.category_id == cat.id)
        .scalar()
        or 0
    )
    return CategoryOut(id=cat.id, name=cat.name, product_count=product_count, stock_units=stock_units)


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    cats = db.query(Category).order_by(Category.name).all()
    return [_to_out(db, c) for c in cats]


@router.post("", response_model=CategoryOut)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db), _: Profile = Depends(require_manager)):
    if db.query(Category).filter(Category.name == payload.name).first():
        raise HTTPException(status_code=409, detail="A category with this name already exists.")
    cat = Category(name=payload.name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return _to_out(db, cat)


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: str, payload: CategoryUpdate, db: Session = Depends(get_db), _: Profile = Depends(require_manager)
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found.")
    cat.name = payload.name
    db.commit()
    db.refresh(cat)
    return _to_out(db, cat)


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: str, db: Session = Depends(get_db), _: Profile = Depends(require_manager)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found.")
    if db.query(Product).filter(Product.category_id == category_id).count() > 0:
        raise HTTPException(status_code=422, detail="Cannot delete a category that still has products.")
    db.delete(cat)
    db.commit()
