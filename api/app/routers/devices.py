from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, status
from sqlalchemy import select

from ..deps import DbSession
from ..models import Measurement, Recipient
from ..schemas import DeviceReadingIn, DeviceReadingOut
from ..service import fill_for

router = APIRouter(prefix="/ingest", tags=["ingest (sensor IoT)"])


@router.post("", response_model=DeviceReadingOut, status_code=status.HTTP_201_CREATED)
def ingest_reading(
    payload: DeviceReadingIn,
    db: DbSession,
    x_device_token: Annotated[str | None, Header()] = None,
):
    """
    Endpoint que o sensor IoT chama a cada leitura.

    Autenticacao por token do dispositivo (header `X-Device-Token`), nao por JWT.
    Grava a leitura e devolve quantos % o recipiente esta cheio.
    """
    if not x_device_token:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Header X-Device-Token e obrigatorio"
        )

    recipient = db.scalar(
        select(Recipient).where(Recipient.device_token == x_device_token)
    )
    if recipient is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token de dispositivo invalido")

    db.add(
        Measurement(
            recipient_id=recipient.id,
            distance_from_lid=payload.distance_from_lid,
        )
    )
    db.commit()

    r = fill_for(recipient, payload.distance_from_lid)
    return DeviceReadingOut(
        recipient_id=recipient.id,
        recipient_name=recipient.name,
        fill_percent=r.fill_percent,
        filled_volume_cm3=r.filled_volume_cm3,
        total_volume_cm3=r.total_volume_cm3,
        mass_g=r.mass_g,
    )
