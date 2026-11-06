"""Modelos ORM: las tres tablas creadas en Supabase (sql/001_tablas.sql)."""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Computed, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String, unique=True)
    descripcion: Mapped[str | None]
    tipo: Mapped[str] = mapped_column(server_default="calzado")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    productos: Mapped[list["Producto"]] = relationship(back_populates="categoria", passive_deletes="all")


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"))
    nombre: Mapped[str]
    marca: Mapped[str]
    talla: Mapped[str]
    condicion: Mapped[str] = mapped_column(server_default="Usado - buen estado")
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    stock: Mapped[int] = mapped_column(server_default="0")
    image_url: Mapped[str | None]
    color: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    categoria: Mapped[Categoria] = relationship(back_populates="productos", lazy="joined")
    ventas: Mapped[list["Venta"]] = relationship(back_populates="producto", passive_deletes="all")

    @property
    def tipo(self) -> str | None:
        """Tipo de la categoría (calzado, polera, hoodie…): decide el modelo 3D."""
        return self.categoria.tipo if self.categoria else None


class Venta(Base):
    __tablename__ = "ventas"

    id: Mapped[int] = mapped_column(primary_key=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"))
    cantidad: Mapped[int] = mapped_column(server_default="1")
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    # Columna calculada por PostgreSQL (generated always as ... stored)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), Computed("cantidad * precio_unitario"))
    canal: Mapped[str] = mapped_column(server_default="Tienda")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    producto: Mapped[Producto] = relationship(back_populates="ventas", lazy="joined")
