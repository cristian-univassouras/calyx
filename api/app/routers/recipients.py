from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from ..calc import DimensionError, validate_dimensions
from ..deps import CurrentUser, DbSession
from ..models import Cabinet, Product, Recipient
from ..schemas import RecipientCreate, RecipientOut, RecipientUpdate
from ..service import serialize_recipient

router = APIRouter(prefix="/recipients", tags=["recipients"])


def _get_owned(db: DbSession, user_id: int, recipient_id: int) -> Recipient:
    recipient = db.get(Recipient, recipient_id)
    if not recipient or recipient.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recipiente nao encontrado")
    return recipient


def _check_product(db: DbSession, product_id: int | None) -> None:
    if product_id is not None and not db.get(Product, product_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto nao encontrado")


def _check_cabinet(db: DbSession, user_id: int, cabinet_id: int | None) -> None:
    if cabinet_id is not None:
        cabinet = db.get(Cabinet, cabinet_id)
        if not cabinet or cabinet.user_id != user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Armario nao encontrado")


@router.get("", response_model=list[RecipientOut])
def list_recipients(
    db: DbSession, user: CurrentUser, cabinet_id: int | None = None
):
    query = select(Recipient).where(Recipient.user_id == user.id)
    if cabinet_id is not None:
        query = query.where(Recipient.cabinet_id == cabinet_id)
    recipients = db.scalars(query.order_by(Recipient.id)).all()
    return [serialize_recipient(db, r) for r in recipients]


@router.post("", response_model=RecipientOut, status_code=status.HTTP_201_CREATED)
def create_recipient(payload: RecipientCreate, db: DbSession, user: CurrentUser):
    try:
        validate_dimensions(payload.format, payload.dimensions)
    except DimensionError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))
    _check_product(db, payload.product_id)
    _check_cabinet(db, user.id, payload.cabinet_id)

    recipient = Recipient(
        user_id=user.id,
        product_id=payload.product_id,
        cabinet_id=payload.cabinet_id,
        name=payload.name,
        format=payload.format,
        dimensions=payload.dimensions,
    )
    db.add(recipient)
    db.commit()
    db.refresh(recipient)
    return serialize_recipient(db, recipient)


@router.get("/{recipient_id}", response_model=RecipientOut)
def get_recipient(recipient_id: int, db: DbSession, user: CurrentUser):
    return serialize_recipient(db, _get_owned(db, user.id, recipient_id))


@router.patch("/{recipient_id}", response_model=RecipientOut)
def update_recipient(
    recipient_id: int, payload: RecipientUpdate, db: DbSession, user: CurrentUser
):
    recipient = _get_owned(db, user.id, recipient_id)

    new_format = payload.format or recipient.format
    new_dimensions = (
        payload.dimensions if payload.dimensions is not None else recipient.dimensions
    )
    if payload.format is not None or payload.dimensions is not None:
        try:
            validate_dimensions(new_format, new_dimensions)
        except DimensionError as e:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))

    if payload.product_id is not None:
        _check_product(db, payload.product_id)
        recipient.product_id = payload.product_id
    # cabinet_id usa model_fields_set p/ permitir mover para "avulso" (null)
    if "cabinet_id" in payload.model_fields_set:
        _check_cabinet(db, user.id, payload.cabinet_id)
        recipient.cabinet_id = payload.cabinet_id
    if payload.name is not None:
        recipient.name = payload.name
    recipient.format = new_format
    recipient.dimensions = new_dimensions

    db.commit()
    db.refresh(recipient)
    return serialize_recipient(db, recipient)


@router.delete("/{recipient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipient(recipient_id: int, db: DbSession, user: CurrentUser):
    recipient = _get_owned(db, user.id, recipient_id)
    db.delete(recipient)
    db.commit()
