from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from ..deps import CurrentUser, DbSession
from ..models import Measurement, Recipient
from ..schemas import FillOut, MeasurementCreate, MeasurementOut
from ..service import fill_for, latest_measurement

router = APIRouter(prefix="/recipients/{recipient_id}", tags=["measurements"])


def _get_owned(db: DbSession, user_id: int, recipient_id: int) -> Recipient:
    recipient = db.get(Recipient, recipient_id)
    if not recipient or recipient.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recipiente nao encontrado")
    return recipient


def _fill_out(recipient: Recipient, distance_from_lid: float) -> FillOut:
    result = fill_for(recipient, distance_from_lid)
    return FillOut(
        recipient_id=recipient.id,
        product_id=recipient.product_id,
        **result.__dict__,
    )


@router.get("/measurements", response_model=list[MeasurementOut], tags=["measurements"])
def list_measurements(
    recipient_id: int,
    db: DbSession,
    user: CurrentUser,
    limit: int = Query(50, ge=1, le=500),
):
    _get_owned(db, user.id, recipient_id)
    return db.scalars(
        select(Measurement)
        .where(Measurement.recipient_id == recipient_id)
        .order_by(Measurement.timestamp.desc())
        .limit(limit)
    ).all()


@router.post(
    "/measurements",
    response_model=FillOut,
    status_code=status.HTTP_201_CREATED,
    tags=["measurements"],
)
def create_measurement(
    recipient_id: int, payload: MeasurementCreate, db: DbSession, user: CurrentUser
):
    """Registra a leitura do sensor e devolve o calculo de % cheio e peso."""
    recipient = _get_owned(db, user.id, recipient_id)
    measurement = Measurement(
        recipient_id=recipient_id, distance_from_lid=payload.distance_from_lid
    )
    db.add(measurement)
    db.commit()
    return _fill_out(recipient, payload.distance_from_lid)


@router.get("/fill", response_model=FillOut, tags=["measurements"])
def current_fill(recipient_id: int, db: DbSession, user: CurrentUser):
    """Calculo a partir da ultima leitura registrada (sem gravar nada)."""
    recipient = _get_owned(db, user.id, recipient_id)
    last = latest_measurement(db, recipient_id)
    if not last:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Nenhuma leitura registrada para este recipiente"
        )
    return _fill_out(recipient, last.distance_from_lid)
