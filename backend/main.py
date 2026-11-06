"""API de inventario y ventas de Aeternum (FastAPI + SQLAlchemy + Supabase)."""
import os
import secrets

from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

API = "/api/v1"

app = FastAPI(
    title="Aeternum · API de Inventario y Ventas",
    version="1.0.0",
    description=(
        "Backend del proyecto de Tecnologías Informáticas (Diplomado UDABOL). "
        "Tres tablas en Supabase (PostgreSQL): **categorias**, **productos** y **ventas**. "
        "Datos de demostración ficticios.\n\n"
        "Código: [github.com/rossmelabasto/ross_aeternum_inventario]"
        "(https://github.com/rossmelabasto/ross_aeternum_inventario)"
    ),
    openapi_tags=[
        {"name": "Categorías", "description": "Tipos de tenis del catálogo"},
        {"name": "Productos", "description": "Inventario: cada par con su talla, precio y stock"},
        {"name": "Ventas", "description": "Registro de ventas; descuenta stock en la misma transacción"},
        {"name": "Sistema", "description": "Estado del servicio"},
    ],
)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)


def requiere_admin(x_admin_key: str | None = Header(None)):
    """Los borrados piden una clave: el resto de la API es abierta para la demo."""
    clave = os.getenv("ADMIN_KEY", "")
    if not clave or not x_admin_key or not secrets.compare_digest(x_admin_key, clave):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Falta o no es válida la cabecera X-Admin-Key")


def producto_out(p: models.Producto) -> schemas.ProductoOut:
    return schemas.ProductoOut.model_validate(p)


def venta_out(v: models.Venta) -> schemas.VentaOut:
    return schemas.VentaOut.model_validate(v)


def obtener(db: Session, modelo, id_: int, nombre: str):
    obj = db.get(modelo, id_)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{nombre} {id_} no existe")
    return obj


def guardar(db: Session, mensaje_conflicto: str):
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, mensaje_conflicto) from e


# ------------------------------------------------------------------ Sistema
@app.get("/", include_in_schema=False)
def inicio():
    return RedirectResponse("/docs")


@app.get(f"{API}/salud", tags=["Sistema"])
def salud(db: Session = Depends(get_db)):
    db.execute(text("select 1"))
    return {"estado": "ok", "base_de_datos": "conectada"}


@app.get(f"{API}/resumen", response_model=schemas.Resumen, tags=["Sistema"])
def resumen(db: Session = Depends(get_db)):
    fila = db.execute(
        text(
            """
            select (select count(*) from productos)                          as productos,
                   (select coalesce(sum(stock), 0) from productos)           as unidades_en_stock,
                   (select coalesce(sum(stock * precio), 0) from productos)  as valor_inventario,
                   (select count(*) from ventas)                             as ventas,
                   (select coalesce(sum(total), 0) from ventas)              as ingresos
            """
        )
    ).one()
    return schemas.Resumen(**fila._mapping)


# --------------------------------------------------------------- Categorías
@app.get(f"{API}/categorias", response_model=list[schemas.CategoriaOut], tags=["Categorías"])
def listar_categorias(db: Session = Depends(get_db)):
    return db.scalars(select(models.Categoria).order_by(models.Categoria.id)).all()


@app.post(
    f"{API}/categorias",
    response_model=schemas.CategoriaOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Categorías"],
)
def crear_categoria(datos: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    cat = models.Categoria(**datos.model_dump())
    db.add(cat)
    guardar(db, "Ya existe una categoría con ese nombre")
    db.refresh(cat)
    return cat


@app.put(f"{API}/categorias/{{categoria_id}}", response_model=schemas.CategoriaOut, tags=["Categorías"])
def editar_categoria(categoria_id: int, datos: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    cat = obtener(db, models.Categoria, categoria_id, "Categoría")
    for campo, valor in datos.model_dump().items():
        setattr(cat, campo, valor)
    guardar(db, "Ya existe una categoría con ese nombre")
    db.refresh(cat)
    return cat


@app.delete(
    f"{API}/categorias/{{categoria_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Categorías"],
    dependencies=[Depends(requiere_admin)],
)
def borrar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    db.delete(obtener(db, models.Categoria, categoria_id, "Categoría"))
    guardar(db, "La categoría tiene productos: muévelos o bórralos antes")


# ---------------------------------------------------------------- Productos
@app.get(f"{API}/productos", response_model=list[schemas.ProductoOut], tags=["Productos"])
def listar_productos(
    categoria_id: int | None = Query(None, description="Filtrar por categoría"),
    con_stock: bool = Query(False, description="Solo productos con stock > 0"),
    db: Session = Depends(get_db),
):
    q = select(models.Producto).order_by(models.Producto.id)
    if categoria_id is not None:
        q = q.where(models.Producto.categoria_id == categoria_id)
    if con_stock:
        q = q.where(models.Producto.stock > 0)
    return [producto_out(p) for p in db.scalars(q).unique().all()]


@app.get(f"{API}/productos/{{producto_id}}", response_model=schemas.ProductoOut, tags=["Productos"])
def ver_producto(producto_id: int, db: Session = Depends(get_db)):
    return producto_out(obtener(db, models.Producto, producto_id, "Producto"))


@app.post(
    f"{API}/productos",
    response_model=schemas.ProductoOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Productos"],
)
def crear_producto(datos: schemas.ProductoCreate, db: Session = Depends(get_db)):
    obtener(db, models.Categoria, datos.categoria_id, "Categoría")
    prod = models.Producto(**datos.model_dump())
    db.add(prod)
    guardar(db, "No se pudo registrar el producto")
    db.refresh(prod)
    return producto_out(prod)


@app.put(f"{API}/productos/{{producto_id}}", response_model=schemas.ProductoOut, tags=["Productos"])
def editar_producto(producto_id: int, datos: schemas.ProductoUpdate, db: Session = Depends(get_db)):
    prod = obtener(db, models.Producto, producto_id, "Producto")
    cambios = datos.model_dump(exclude_unset=True)
    if "categoria_id" in cambios:
        obtener(db, models.Categoria, cambios["categoria_id"], "Categoría")
    for campo, valor in cambios.items():
        setattr(prod, campo, valor)
    guardar(db, "No se pudo actualizar el producto")
    db.refresh(prod)
    return producto_out(prod)


@app.patch(f"{API}/productos/{{producto_id}}/stock", response_model=schemas.ProductoOut, tags=["Productos"])
def cambiar_stock(producto_id: int, datos: schemas.StockUpdate, db: Session = Depends(get_db)):
    """Fija el stock (por ejemplo, al reponer). Para vender se usa POST /ventas."""
    prod = obtener(db, models.Producto, producto_id, "Producto")
    prod.stock = datos.stock
    guardar(db, "No se pudo actualizar el stock")
    db.refresh(prod)
    return producto_out(prod)


@app.delete(
    f"{API}/productos/{{producto_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Productos"],
    dependencies=[Depends(requiere_admin)],
)
def borrar_producto(producto_id: int, db: Session = Depends(get_db)):
    db.delete(obtener(db, models.Producto, producto_id, "Producto"))
    guardar(db, "El producto tiene ventas registradas y no se puede borrar")


# ------------------------------------------------------------------- Ventas
VENDER = text(
    """
    with p as (
        update productos set stock = stock - :c
        where id = :id and stock >= :c
        returning id, nombre, precio, stock
    ), v as (
        insert into ventas (producto_id, cantidad, precio_unitario, canal)
        select id, :c, precio, :canal from p
        returning *
    )
    select v.*, p.nombre as producto, p.stock as stock_restante from v join p on p.id = v.producto_id
    """
)

@app.get(f"{API}/ventas", response_model=list[schemas.VentaOut], tags=["Ventas"])
def listar_ventas(limite: int = Query(50, ge=1, le=500), db: Session = Depends(get_db)):
    q = select(models.Venta).order_by(models.Venta.id.desc()).limit(limite)
    return [venta_out(v) for v in db.scalars(q).unique().all()]


@app.post(
    f"{API}/ventas",
    response_model=schemas.VentaRegistrada,
    status_code=status.HTTP_201_CREATED,
    tags=["Ventas"],
    responses={409: {"description": "No hay stock suficiente"}},
)
def registrar_venta(datos: schemas.VentaCreate, db: Session = Depends(get_db)):
    """Descuenta el stock y registra la venta en **una sola sentencia SQL** (atómica).

    El UPDATE solo afecta la fila si `stock >= cantidad`: si dos personas compran el último
    par al mismo tiempo, solo una venta pasa y la otra recibe 409.
    """
    fila = db.execute(VENDER, {"id": datos.producto_id, "c": datos.cantidad, "canal": datos.canal}).first()
    if fila is None:
        obtener(db, models.Producto, datos.producto_id, "Producto")  # 404 si no existe
        raise HTTPException(status.HTTP_409_CONFLICT, "No hay stock suficiente para esa venta")
    venta = schemas.VentaOut.model_validate(dict(fila._mapping))
    return schemas.VentaRegistrada(venta=venta, stock_restante=fila.stock_restante)
