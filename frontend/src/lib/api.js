// Cliente HTTP de la API de Aeternum (FastAPI + Supabase).
export const API_URL = (import.meta.env.VITE_API_URL || 'https://aeternum-api.rossmel.com/api/v1').replace(/\/$/, '')

const oyentes = new Set()
const registro = []

/** Cada llamada queda en un registro que el panel muestra como "api.log". */
export function escucharRegistro(fn) {
  oyentes.add(fn)
  fn([...registro])
  return () => oyentes.delete(fn)
}

function anotar(linea) {
  registro.unshift({ ...linea, hora: new Date() })
  registro.length = Math.min(registro.length, 40)
  oyentes.forEach((fn) => fn([...registro]))
}

async function pedir(metodo, ruta, cuerpo) {
  const inicio = performance.now()
  let estado = 0
  try {
    const r = await fetch(API_URL + ruta, {
      method: metodo,
      headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    })
    estado = r.status
    const datos = r.status === 204 ? null : await r.json().catch(() => null)
    if (!r.ok) {
      const det = datos?.detail
      const msg = Array.isArray(det) ? det.map((d) => `${d.loc?.at(-1)}: ${d.msg}`).join(' · ') : det
      throw new Error(msg || `Error ${r.status}`)
    }
    return datos
  } catch (e) {
    if (!estado) e.message = 'No se pudo conectar con la API'
    throw e
  } finally {
    anotar({ metodo, ruta, estado, ms: Math.round(performance.now() - inicio) })
  }
}

export const api = {
  resumen: () => pedir('GET', '/resumen'),
  categorias: () => pedir('GET', '/categorias'),
  productos: () => pedir('GET', '/productos'),
  producto: (id) => pedir('GET', `/productos/${id}`),
  crearProducto: (datos) => pedir('POST', '/productos', datos),
  cambiarStock: (id, stock) => pedir('PATCH', `/productos/${id}/stock`, { stock }),
  ventas: (limite = 8) => pedir('GET', `/ventas?limite=${limite}`),
  vender: (producto_id, canal = 'Tienda') => pedir('POST', '/ventas', { producto_id, cantidad: 1, canal }),
}

export const bs = (n) =>
  'Bs ' + Number(n).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
