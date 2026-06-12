from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import Format


# ----------------------------- Auth / Users -----------------------------
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ----------------------------- Categories -----------------------------
class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    method: str | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    method: str | None


# ----------------------------- Products -----------------------------
class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    density: float = Field(gt=0, description="g/cm3")
    icon: str | None = Field(default=None, max_length=16)
    content_category: int | None = None


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    density: float | None = Field(default=None, gt=0, description="g/cm3")
    icon: str | None = Field(default=None, max_length=16)
    content_category: int | None = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    density: float
    icon: str | None
    content_category: int | None


# ----------------------------- Cabinets -----------------------------
class CabinetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    icon: str | None = Field(default=None, max_length=16)


class CabinetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    icon: str | None = Field(default=None, max_length=16)


class CabinetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    name: str
    icon: str | None
    recipient_count: int = 0


# ----------------------------- Recipients -----------------------------
class RecipientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    format: Format
    dimensions: dict
    product_id: int | None = None
    cabinet_id: int | None = None


class RecipientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    format: Format | None = None
    dimensions: dict | None = None
    product_id: int | None = None
    cabinet_id: int | None = None


class RecipientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    product_id: int | None
    cabinet_id: int | None
    name: str
    format: Format
    dimensions: dict
    device_token: str
    # estado atual derivado da ultima leitura do sensor (None se nunca leu)
    last_fill_percent: float | None = None
    last_distance_from_lid: float | None = None
    last_mass_g: float | None = None
    last_reading_at: datetime | None = None


# ----------------------------- Measurements -----------------------------
class MeasurementCreate(BaseModel):
    distance_from_lid: float = Field(ge=0, description="cm da tampa ate o conteudo")


class MeasurementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    recipient_id: int
    distance_from_lid: float
    timestamp: datetime


# ----------------------------- Calculo -----------------------------
class FillOut(BaseModel):
    recipient_id: int
    distance_from_lid: float
    filled_volume_cm3: float
    total_volume_cm3: float
    fill_percent: float
    mass_g: float | None
    product_id: int | None


# ----------------------------- Ingestao do sensor IoT -----------------------------
class DeviceReadingIn(BaseModel):
    distance_from_lid: float = Field(ge=0, description="cm da tampa ate o conteudo")


class DeviceReadingOut(BaseModel):
    recipient_id: int
    recipient_name: str
    fill_percent: float
    filled_volume_cm3: float
    total_volume_cm3: float
    mass_g: float | None
