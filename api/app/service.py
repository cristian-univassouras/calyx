"""Funcoes compartilhadas entre os routers (calculo de nivel e serializacao)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from .calc import FillResult, compute_fill
from .models import Measurement, Recipient
from .schemas import RecipientOut


def latest_measurement(db: Session, recipient_id: int) -> Measurement | None:
    return db.scalar(
        select(Measurement)
        .where(Measurement.recipient_id == recipient_id)
        .order_by(Measurement.timestamp.desc())
        .limit(1)
    )


def fill_for(recipient: Recipient, distance_from_lid: float) -> FillResult:
    """Calcula volume/%/peso para uma distancia, usando a densidade do produto."""
    density = recipient.product.density if recipient.product else None
    return compute_fill(
        recipient.format, recipient.dimensions, distance_from_lid, density
    )


def serialize_recipient(db: Session, recipient: Recipient) -> RecipientOut:
    """Monta o RecipientOut incluindo o estado atual (ultima leitura do sensor)."""
    last = latest_measurement(db, recipient.id)
    data = {
        "id": recipient.id,
        "user_id": recipient.user_id,
        "product_id": recipient.product_id,
        "cabinet_id": recipient.cabinet_id,
        "name": recipient.name,
        "format": recipient.format,
        "dimensions": recipient.dimensions,
        "device_token": recipient.device_token,
    }
    if last is not None:
        r = fill_for(recipient, last.distance_from_lid)
        data.update(
            last_fill_percent=r.fill_percent,
            last_distance_from_lid=last.distance_from_lid,
            last_mass_g=r.mass_g,
            last_reading_at=last.timestamp,
        )
    return RecipientOut(**data)
