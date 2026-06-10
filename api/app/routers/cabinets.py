from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from ..deps import CurrentUser, DbSession
from ..models import Cabinet, Recipient
from ..schemas import CabinetCreate, CabinetOut, CabinetUpdate

router = APIRouter(prefix="/cabinets", tags=["cabinets"])


def _get_owned(db: DbSession, user_id: int, cabinet_id: int) -> Cabinet:
    cabinet = db.get(Cabinet, cabinet_id)
    if not cabinet or cabinet.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Armario nao encontrado")
    return cabinet


def _counts(db: DbSession, user_id: int) -> dict[int, int]:
    rows = db.execute(
        select(Recipient.cabinet_id, func.count())
        .where(Recipient.user_id == user_id, Recipient.cabinet_id.isnot(None))
        .group_by(Recipient.cabinet_id)
    ).all()
    return {cid: n for cid, n in rows}


def _out(cabinet: Cabinet, count: int) -> CabinetOut:
    return CabinetOut(
        id=cabinet.id,
        user_id=cabinet.user_id,
        name=cabinet.name,
        icon=cabinet.icon,
        recipient_count=count,
    )


@router.get("", response_model=list[CabinetOut])
def list_cabinets(db: DbSession, user: CurrentUser):
    cabinets = db.scalars(
        select(Cabinet).where(Cabinet.user_id == user.id).order_by(Cabinet.id)
    ).all()
    counts = _counts(db, user.id)
    return [_out(c, counts.get(c.id, 0)) for c in cabinets]


@router.post("", response_model=CabinetOut, status_code=status.HTTP_201_CREATED)
def create_cabinet(payload: CabinetCreate, db: DbSession, user: CurrentUser):
    cabinet = Cabinet(user_id=user.id, name=payload.name, icon=payload.icon)
    db.add(cabinet)
    db.commit()
    db.refresh(cabinet)
    return _out(cabinet, 0)


@router.get("/{cabinet_id}", response_model=CabinetOut)
def get_cabinet(cabinet_id: int, db: DbSession, user: CurrentUser):
    cabinet = _get_owned(db, user.id, cabinet_id)
    return _out(cabinet, _counts(db, user.id).get(cabinet_id, 0))


@router.patch("/{cabinet_id}", response_model=CabinetOut)
def update_cabinet(
    cabinet_id: int, payload: CabinetUpdate, db: DbSession, user: CurrentUser
):
    cabinet = _get_owned(db, user.id, cabinet_id)
    if payload.name is not None:
        cabinet.name = payload.name
    if payload.icon is not None:
        cabinet.icon = payload.icon
    db.commit()
    db.refresh(cabinet)
    return _out(cabinet, _counts(db, user.id).get(cabinet_id, 0))


@router.delete("/{cabinet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cabinet(cabinet_id: int, db: DbSession, user: CurrentUser):
    # os recipientes nao sao apagados: ficam sem armario (ON DELETE SET NULL)
    cabinet = _get_owned(db, user.id, cabinet_id)
    db.delete(cabinet)
    db.commit()
