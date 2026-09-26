from app.db.models import InventoryOperation
from app.schemas.operation import OperationOut, OperationItemOut


def serialize_operation(op: InventoryOperation) -> OperationOut:
    return OperationOut(
        id=op.id,
        reference=op.reference,
        type=op.type,
        status=op.status,
        partner_name=op.partner_name,
        source_location_id=op.source_location_id,
        source_location_name=op.source_location.name if op.source_location else None,
        destination_location_id=op.destination_location_id,
        destination_location_name=op.destination_location.name if op.destination_location else None,
        notes=op.notes,
        created_at=op.created_at,
        validated_at=op.validated_at,
        items=[
            OperationItemOut(
                id=i.id,
                product_id=i.product_id,
                product_name=i.product.name if i.product else None,
                sku=i.product.sku if i.product else None,
                quantity=i.quantity,
                processed_quantity=i.processed_quantity,
            )
            for i in op.items
        ],
    )
