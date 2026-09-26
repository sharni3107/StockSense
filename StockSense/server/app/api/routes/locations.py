from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_manager
from app.db.session import get_db
from app.db.models import Location, Warehouse, Stock, Profile
from app.schemas.warehouse import LocationOut, LocationCreate, LocationUpdate

router = APIRouter(prefix="/api/locations", tags=["locations"])


def _to_out(db: Session, loc: Location) -> LocationOut:
    rows = db.query(Stock).filter(Stock.location_id == loc.id, Stock.quantity != 0).all()
    return LocationOut(
        id=loc.id,
        name=loc.name,
        code=loc.code,
        warehouse_id=loc.warehouse_id,
        warehouse_name=loc.warehouse.name if loc.warehouse else None,
        product_count=len(rows),
        total_units=sum(r.quantity for r in rows),
    )


@router.get("", response_model=list[LocationOut])
def list_locations(
    warehouse_id: str | None = Query(None), db: Session = Depends(get_db), _: Profile = Depends(get_current_user)
):
    q = db.query(Location)
    if warehouse_id:
        q = q.filter(Location.warehouse_id == warehouse_id)
    return [_to_out(db, l) for l in q.order_by(Location.name).all()]


@router.post("", response_model=LocationOut)
def create_location(payload: LocationCreate, db: Session = Depends(get_db), _: Profile = Depends(require_manager)):
    if not db.query(Warehouse).filter(Warehouse.id == payload.warehouse_id).first():
        raise HTTPException(status_code=422, detail="Selected warehouse does not exist.")
    exists = (
        db.query(Location)
        .filter(Location.warehouse_id == payload.warehouse_id, Location.code == payload.code)
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="This warehouse already has a location with that code.")
    loc = Location(name=payload.name, code=payload.code, warehouse_id=payload.warehouse_id)
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return _to_out(db, loc)


@router.put("/{location_id}", response_model=LocationOut)
def update_location(
    location_id: str, payload: LocationUpdate, db: Session = Depends(get_db), _: Profile = Depends(require_manager)
):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(loc, field, value)
    db.commit()
    db.refresh(loc)
    return _to_out(db, loc)


@router.delete("/{location_id}", status_code=204)
def delete_location(location_id: str, db: Session = Depends(get_db), _: Profile = Depends(require_manager)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found.")
    if db.query(Stock).filter(Stock.location_id == location_id, Stock.quantity != 0).count() > 0:
        raise HTTPException(status_code=422, detail="This location still has stock on hand.")
    db.delete(loc)
    db.commit()
