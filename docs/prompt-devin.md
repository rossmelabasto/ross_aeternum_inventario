# Prompt para Devin (adaptado a este proyecto)

Lo pide la rúbrica ("¿presentan el log/prompt de asistencia del código?"). El frontend de este repo se
programó con Claude Code como asistente; este es el prompt equivalente por si se quiere correr en
https://app.devin.ai para la captura.

---

Hola Devin. Necesito el frontend de una aplicación web de inventario y ventas de tenis de segunda mano
(tienda Aeternum), con React, Vite y Tailwind CSS.

Repositorio: https://github.com/rossmelabasto/ross_aeternum_inventario.git
Escribe todo el código estrictamente dentro de la carpeta `frontend/`.

El backend ya existe: FastAPI desplegado en https://aeternum-api.rossmel.com, conectado a Supabase con
tres tablas: `categorias` (id, nombre, descripcion), `productos` (id, categoria_id, nombre, marca, talla,
condicion, precio, stock, image_url) y `ventas` (id, producto_id, cantidad, precio_unitario, total, canal).
Documentación: https://aeternum-api.rossmel.com/docs

1. Cliente HTTP con fetch sobre `VITE_API_URL=https://aeternum-api.rossmel.com/api/v1` (deja un
   `.env.example`): GET `/categorias`, GET y POST `/productos`, PATCH `/productos/{id}/stock`,
   GET y POST `/ventas`, GET `/resumen`.
2. Vista inicial: tienda 3D con @react-three/fiber y @react-three/drei. Un estante por categoría con los
   pares de la API dibujados de forma esquemática; al pasar el mouse, nombre, precio y stock. Botón
   flotante para entrar al panel de ventas.
3. Panel de ventas: lista en tiempo real (nombre, talla, precio, stock), formulario para registrar
   productos y un botón "Vender 1 unidad" por producto que descuente el stock al instante en la interfaz
   y llame a POST `/ventas`.
4. Visor 3D independiente de una zapatilla que se pueda girar y acercar con el mouse (OrbitControls).
5. Código modular en `src/components/`. Estilo oscuro con acento lima #afff00.
6. Haz commit y push a la rama `main`.
