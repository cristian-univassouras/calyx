import enum
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Format(str, enum.Enum):
    cilindric = "cilindric"
    square = "square"
    conical = "conical"
    spherical = "spherical"
    rectangular = "rectangular"
    custom = "custom"


# Mapeia para o tipo ENUM "format" ja existente no banco (nao recria).
format_enum = Enum(
    Format,
    name="format",
    create_type=False,
    values_callable=lambda e: [m.value for m in e],
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    recipients: Mapped[list["Recipient"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    method: Mapped[str | None] = mapped_column(Text, nullable=True)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    density: Mapped[float] = mapped_column(Float, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(16), nullable=True)
    content_category: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (CheckConstraint("density > 0", name="products_density_check"),)


class Cabinet(Base):
    __tablename__ = "cabinets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(16), nullable=True)

    recipients: Mapped[list["Recipient"]] = relationship(back_populates="cabinet")


class Recipient(Base):
    __tablename__ = "recipients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    cabinet_id: Mapped[int | None] = mapped_column(
        ForeignKey("cabinets.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    format: Mapped[Format] = mapped_column(format_enum, nullable=False)
    dimensions: Mapped[dict] = mapped_column(JSONB, nullable=False)
    device_token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        server_default=text("encode(gen_random_bytes(16), 'hex')"),
    )

    user: Mapped["User"] = relationship(back_populates="recipients")
    product: Mapped["Product | None"] = relationship()
    cabinet: Mapped["Cabinet | None"] = relationship(back_populates="recipients")
    measurements: Mapped[list["Measurement"]] = relationship(
        back_populates="recipient", cascade="all, delete-orphan"
    )


class Measurement(Base):
    __tablename__ = "measurements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    recipient_id: Mapped[int] = mapped_column(
        ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False
    )
    distance_from_lid: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    recipient: Mapped["Recipient"] = relationship(back_populates="measurements")
