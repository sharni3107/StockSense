from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_manager
from app.db.session import get_db
from app.db.models import Warehouse, Location, Profile
from app.schemas.warehouse import WarehouseOut, WarehouseCreate, WarehouseUpdate

router = APIRouter(prefix="/api/warehouses", tags=["warehouses"])


def _to_out(db: Session, wh: Warehouse) -> WarehouseOut:
    count = db.query(func.count(Location.id)).filter(Location.warehouse_id == wh.id).scalar() or 0
    return WarehouseOut(id=wh.id, name=wh.name, code=wh.code, address=wh.address, location_count=count)


@router.get("", response_model=list[WarehouseOut])
def list_warehouses(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    return [_to_out(db, w) for w in db.query(Warehouse).order_by(Warehouse.name).all()]


@router.post("", response_model=WarehouseOut)
def create_warehouse(payload: WarehouseCreate, db: Session = Depends(get_db), _: Profile = Depends(require_manager)):
    if db.query(Warehouse).filter(Warehouse.code == payload.code).first():
        raise HTTPException(status_code=409, detail="A warehouse with this code already exists.")
    wh = Warehouse(name=payload.name, code=payload.code, address=payload.address)
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return _to_out(db, wh)


@router.put("/{warehouse_id}", response_model=WarehouseOut)
def update_warehouse(
    warehouse_id: str, payload: WarehouseUpdate, db: Session = Depends(get_db), _: Profile = Depends(require_manager)
):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if wh is None:
        raise HTTPException(status_code=404, detail="Warehouse not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(wh, field, value)
    db.commit()
    db.refresh(wh)
    return _to_out(db, wh)


@router.delete("/{warehouse_id}", status_code=204)
def delete_warehouse(warehouse_id: str, db: Session = Depends(get_db), _: Profile = Depends(require_manager)):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if wh is None:
        raise HTTPException(status_code=404, detail="Warehouse not found.")
    if db.query(Location).filter(Location.warehouse_id == warehouse_id).count() > 0:
        raise HTTPException(status_code=422, detail="Remove this warehouse's locations first.")
    db.delete(wh)
    db.commit()
