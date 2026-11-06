"""Esquemas Pydantic: qué entra y qué sale de la API (validación automática)."""
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

Condicion = Literal["Nuevo", "Usado - como nuevo", "Usado - buen estado"]
Canal = Literal["Tienda", "Marketplace", "WhatsApp", "Instagram"]
Tipo = Literal["calzado", "polera", "hoodie", "chamarra", "pantalon", "gorra"]
COLOR = r"^#[0-9a-fA-F]{6}$"


# ---------- Categorías ----------
class CategoriaBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=60, examples=["Urbanas"])
    descripcion: str | None = Field(None, max_length=200, examples=["Tenis de uso diario"])
    tipo: Tipo = "calzado"


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaOut(CategoriaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------- Productos ----------
class ProductoBase(BaseModel):
    categoria_id: int = Field(examples=[1])
    nombre: str = Field(min_length=2, max_length=80, examples=["Air Force 1 Low"])
    marca: str = Field(min_length=2, max_length=40, examples=["Nike"])
    talla: str = Field(min_length=1, max_length=8, examples=["41", "M", "32"])
    condicion: Condicion = "Usado - buen estado"
    precio: Decimal = Field(gt=0, max_digits=10, decimal_places=2, examples=[420])
    stock: int = Field(0, ge=0, examples=[2])
    image_url: str | None = None
    color: str | None = Field(None, pattern=COLOR, examples=["#afff00"])


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    """Actualización parcial: solo se cambian los campos enviados."""
    categoria_id: int | None = None
    nombre: str | None = Field(None, min_length=2, max_length=80)
    marca: str | None = Field(None, min_length=2, max_length=40)
    talla: str | None = Field(None, min_length=1, max_length=8)
    condicion: Condicion | None = None
    precio: Decimal | None = Field(None, gt=0, max_digits=10, decimal_places=2)
    stock: int | None = Field(None, ge=0)
    image_url: str | None = None
    color: str | None = Field(None, pattern=COLOR)


class StockUpdate(BaseModel):
    stock: int = Field(ge=0, examples=[5])


class ProductoOut(ProductoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    categoria: str | None = None
    tipo: str | None = None
    created_at: datetime

    @field_validator("categoria", mode="before")
    @classmethod
    def _nombre_categoria(cls, v):
        return getattr(v, "nombre", v)


# ---------- Ventas ----------
class VentaCreate(BaseModel):
    producto_id: int = Field(examples=[1])
    cantidad: int = Field(1, gt=0, le=20)
    canal: Canal = "Tienda"


class VentaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    producto_id: int
    producto: str | None = None
    cantidad: int
    precio_unitario: Decimal
    total: Decimal
    canal: str
    created_at: datetime

    @field_validator("producto", mode="before")
    @classmethod
    def _nombre_producto(cls, v):
        return getattr(v, "nombre", v)


class VentaRegistrada(BaseModel):
    venta: VentaOut
    stock_restante: int


class Resumen(BaseModel):
    productos: int
    unidades_en_stock: int
    valor_inventario: Decimal
    ventas: int
    ingresos: Decimal
