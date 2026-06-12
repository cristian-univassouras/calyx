from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from ..deps import CurrentUser, DbSession
from ..models import Category, Product
from ..schemas import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def _check_category(db: DbSession, category_id: int | None) -> None:
    if category_id is not None and not db.get(Category, category_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Categoria nao encontrada")


@router.get("", response_model=list[ProductOut])
def list_products(db: DbSession, _: CurrentUser):
    return db.scalars(select(Product).order_by(Product.id)).all()


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: DbSession, _: CurrentUser):
    _check_category(db, payload.content_category)
    product = Product(
        name=payload.name,
        density=payload.density,
        icon=payload.icon,
        content_category=payload.content_category,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: DbSession, _: CurrentUser):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto nao encontrado")
    return product


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int, payload: ProductUpdate, db: DbSession, _: CurrentUser
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto nao encontrado")
    if payload.name is not None:
        product.name = payload.name
    if payload.density is not None:
        product.density = payload.density
    if payload.icon is not None:
        product.icon = payload.icon
    if "content_category" in payload.model_fields_set:
        _check_category(db, payload.content_category)
        product.content_category = payload.content_category
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: DbSession, _: CurrentUser):
    # recipientes que usam o produto ficam sem produto (ON DELETE SET NULL)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto nao encontrado")
    db.delete(product)
    db.commit()
