from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_manager
from app.db.session import get_db
from app.db.models import ReorderingRule, Stock, Profile
from app.schemas.ledger import ReorderRuleOut, ReorderRuleCreate, ReorderRuleUpdate

router = APIRouter(prefix="/api/reorder-rules", tags=["reorder-rules"])


def _status(current: float, min_qty: float) -> str:
    if current <= 0:
        return "critical"
    if current <= min_qty:
        return "needs_reorder"
    return "healthy"


def _to_out(db: Session, rule: ReorderingRule) -> ReorderRuleOut:
    stock = (
        db.query(Stock)
        .filter(Stock.product_id == rule.product_id, Stock.location_id == rule.location_id)
        .first()
    )
    current = stock.quantity if stock else 0
    return ReorderRuleOut(
        id=rule.id,
        product_id=rule.product_id,
        product_name=rule.product.name if rule.product else None,
        sku=rule.product.sku if rule.product else None,
        location_id=rule.location_id,
        location_name=rule.location.name if rule.location else None,
        min_qty=rule.min_qty,
        max_qty=rule.max_qty,
        current_stock=current,
        status=_status(current, rule.min_qty),
    )


@router.get("", response_model=list[ReorderRuleOut])
def list_rules(db: Session = Depends(get_db), _: Profile = Depends(get_current_user)):
    return [_to_out(db, r) for r in db.query(ReorderingRule).all()]


@router.post("", response_model=ReorderRuleOut)
def create_rule(payload: ReorderRuleCreate, db: Session = Depends(get_db), _: Profile = Depends(require_manager)):
    exists = (
        db.query(ReorderingRule)
        .filter(ReorderingRule.product_id == payload.product_id, ReorderingRule.location_id == payload.location_id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="A rule already exists for this product/location.")
    rule = ReorderingRule(**payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return _to_out(db, rule)


@router.put("/{rule_id}", response_model=ReorderRuleOut)
def update_rule(
    rule_id: str, payload: ReorderRuleUpdate, db: Session = Depends(get_db), _: Profile = Depends(require_manager)
):
    rule = db.query(ReorderingRule).filter(ReorderingRule.id == rule_id).first()
    if rule is None:
        raise HTTPException(status_code=404, detail="Reordering rule not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return _to_out(db, rule)


@router.delete("/{rule_id}", status_code=204)
def delete_rule(rule_id: str, db: Session = Depends(get_db), _: Profile = Depends(require_manager)):
    rule = db.query(ReorderingRule).filter(ReorderingRule.id == rule_id).first()
    if rule is None:
        raise HTTPException(status_code=404, detail="Reordering rule not found.")
    db.delete(rule)
    db.commit()
