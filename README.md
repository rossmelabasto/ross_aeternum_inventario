# Aeternum · Tienda 3D e inventario

Proyecto de **Tecnologías Informáticas** (Diplomado en Desarrollo de Software, UDABOL).
Inventario y ventas de [Aeternum](https://aeternum.boutique), una tienda de tenis y ropa de segunda mano:
una tienda 3D que se recorre como un juego, un panel de ventas y una API REST sobre PostgreSQL (Supabase).

> Los datos son ficticios. Esta demo no toca la base de datos real de la tienda.

| | Enlace |
|---|---|
| Tienda 3D y panel | https://aeternum-3d.rossmel.com |
| API (Swagger) | https://aeternum-api.rossmel.com/docs |
| API (ReDoc) | https://aeternum-api.rossmel.com/redoc |

## Arquitectura

```
Navegador ──► aeternum-3d.rossmel.com ──► nginx (React + Vite + Three.js)
    │
    └──────► aeternum-api.rossmel.com ──► FastAPI + SQLAlchemy ──► Supabase (PostgreSQL)
                         ▲
              Cloudflare Tunnel → servidor propio (Docker)
```

En vez de Render y Vercel, backend y frontend corren en un servidor propio con Docker
y se publican con Cloudflare Tunnel bajo el dominio `rossmel.com` (con permiso de la docente).

## Base de datos: 3 tablas

```
categorias (1) ──< productos (N) ──< ventas (N)
```

| Tabla | Campos | Notas |
|---|---|---|
| `categorias` | id, nombre (único), descripcion, tipo, created_at | `tipo`: calzado, polera, hoodie, chamarra, pantalon o gorra (decide el modelo 3D) |
| `productos` | id, categoria_id → categorias, nombre, marca, talla, condicion, precio, stock, color, image_url, created_at | `stock >= 0`, `precio > 0`, talla en texto (41, M, 32, 7 1/4), color hexadecimal |
| `ventas` | id, producto_id → productos, cantidad, precio_unitario, total (calculado), canal, created_at | `total = cantidad × precio_unitario` lo calcula PostgreSQL |

SQL en [`backend/sql/`](backend/sql): tablas y RLS (`001`), rol propio de la API (`002`), datos de demo (`003`),
un ajuste que pidió el asesor de seguridad de Supabase (`004`) y la ampliación a ropa (`005`: `tipo`, `color`,
talla en texto, 5 categorías y 37 productos más; 8 categorías y 47 productos en total). La API se conecta por el *session pooler* (IPv4).
La API entra con un rol `aeternum_api` con permisos mínimos (sin borrar ventas), no con el usuario `postgres`.

## API (FastAPI)

Base: `/api/v1`

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/categorias` | Lista categorías |
| POST | `/categorias` | Crea una categoría |
| PUT | `/categorias/{id}` | Edita una categoría |
| DELETE | `/categorias/{id}` | Borra (pide `X-Admin-Key`; 409 si tiene productos) |
| GET | `/productos?categoria_id=&con_stock=` | Lista productos con filtros |
| GET | `/productos/{id}` | Un producto |
| POST | `/productos` | Registra un producto |
| PUT | `/productos/{id}` | Edita campos sueltos |
| PATCH | `/productos/{id}/stock` | Fija el stock (reponer) |
| DELETE | `/productos/{id}` | Borra (pide `X-Admin-Key`; 409 si tiene ventas) |
| GET | `/ventas?limite=` | Últimas ventas |
| POST | `/ventas` | Vende: descuenta stock y registra la venta en una sola transacción |
| GET | `/resumen` | Totales para el panel |
| GET | `/salud` | Estado del servicio y de la base |

`POST /ventas` es una sola sentencia SQL (un CTE con `UPDATE … SET stock = stock - n WHERE id = … AND stock >= n RETURNING …`
seguido del `INSERT` de la venta), así que es atómica: si dos personas compran el último par al mismo tiempo, solo una venta pasa y la otra recibe `409`.
Probado con 10 ventas simultáneas sobre 3 pares: 3 ventas `201`, 7 rechazos `409`, stock final 0.

La conexión usa `AUTOCOMMIT`: como la base está lejos (Supabase en us-east-1), cada lectura hace un solo
viaje de ida y vuelta en vez de cuatro (ping, `BEGIN`, consulta, `ROLLBACK`); bajó de ~750 ms a ~190 ms.

## Frontend (React + Vite + Tailwind + Three.js)

- **Tienda 3D** (`#/`): el interior de una tienda que se recorre en primera persona.
  - Controles: clic en la escena para capturar el mouse y mirar como en Minecraft (pointer lock, `Esc` lo
    suelta, sensibilidad ajustable), `W A S D` o flechas para caminar, `←/→` para girar; mira en el centro
    que detecta el producto apuntado. En el celular, cruceta táctil y arrastrar para mirar. Colisiones con
    paredes y muebles.
  - Pared del fondo con repisas de calzado, rieles con ropa colgada en las paredes laterales, mesa de gorras,
    podio con el par destacado, caja, probadores con espejo, plantas, pufs, alfombra, luces de techo, vidriera
    de entrada y letrero neón. Cada sección tiene su letrero con la cantidad de productos.
  - Todo lo que hay en la tienda sale de la API: las secciones se arman solas a partir de las categorías
    (`tipo` decide si van en repisa, riel o mesa) y los productos agotados se ven transparentes.
  - Clic en un producto: ficha con talla, stock, condición y precio, **Vender 1 unidad** y **Ver en 3D**.
  - Buscador "¿qué buscas?" que te lleva caminando hasta el producto y lo marca con una flecha, y un
    minimapa con tu posición (clic en el plano para ir a ese punto).
- **Panel de ventas** (`#/panel`): totales, lista con filtros, botón **Vender 1 unidad** (baja el stock al
  instante y lo confirma con el backend; si falla, vuelve al valor real), reponer stock, formulario de
  registro con color, últimas ventas y un `api.log` con cada petición y su código HTTP.
- **Visor 3D** (`#/visor/:id`): cualquier producto en grande, se gira y se acerca con el mouse (`OrbitControls`).
- Los modelos (zapatillas, poleras, hoodies, chamarras, pantalones y gorras) están hechos con formas
  extruidas de Three.js, sin archivos externos. Tema oscuro (lima) y claro (violeta).

## Cómo correrlo en local

**Backend** (Windows PowerShell; en Linux, `source venv/bin/activate`):

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # y poner la cadena de conexión de Supabase
uvicorn main:app --reload --port 8000
```

Swagger queda en http://127.0.0.1:8000/docs.

**Frontend:**

```powershell
cd frontend
copy .env.example .env   # VITE_API_URL=http://127.0.0.1:8000/api/v1 para usar la API local
npm install
npm run dev
```

## Despliegue

`deploy/deploy.sh` compila el frontend, copia todo al servidor con `rsync` y levanta dos contenedores
con `docker compose` (`deploy/docker-compose.yml`): `aeternum-api` (FastAPI) y `aeternum-3d` (nginx).
Los puertos solo escuchan en `127.0.0.1`; Cloudflare Tunnel los publica con HTTPS.

## Tecnologías

Supabase · PostgreSQL · FastAPI · SQLAlchemy 2 · Pydantic · Swagger/OpenAPI · React 19 · Vite ·
Tailwind CSS 4 · Three.js · React Three Fiber · Docker · nginx · Cloudflare Tunnel · GitHub

---

Rossmel Max Abasto Maire · 2026
