// Plano de la tienda (en metros). X: izquierda→derecha, Z: fondo (−) → entrada (+).
import { TIPOS } from '../../lib/colores.js'

export const SALA = { x0: -8, x1: 8, z0: -10, z1: 10, alto: 3.6 }
export const OJOS = 1.65
export const INICIO = { x: 0, z: 8.4, yaw: 0, pitch: -0.06 }
export const PUERTA = 1.6 // media anchura de la puerta de entrada

const COLGADOS = ['polera', 'hoodie', 'chamarra', 'pantalon']
const MESAS = [[0, -3.4], [-3.6, -3.4], [3.6, -3.4], [-3.6, 0.2], [3.6, 0.2]]
export const PODIO = { x: 0, z: 2.4, r: 0.75 }
export const CAJA = { x: 5.4, z: 7.7, ancho: 3.0, fondo: 0.8 }
export const PROBADORES = { x0: -8, x1: -5, z0: 6.6, z1: 10 }
export const PUFS = [[-4.8, -6.9], [4.8, -6.9], [0, -6.9]]
export const PLANTAS = [[-7.3, -9.3], [7.3, -9.3], [-2.6, 9.3], [2.6, 9.3], [7.3, 5.9]]

const repartir = (n, desde, hasta, hueco) => {
  const largo = (hasta - desde - hueco * (n - 1)) / n
  return Array.from({ length: n }, (_, i) => ({ centro: desde + largo / 2 + i * (largo + hueco), largo }))
}

/** Una sección por categoría: repisas (calzado), rieles (ropa) o mesas (gorras y el resto). */
export function seccionesDe(categorias) {
  const orden = (a, b) => TIPOS.indexOf(a.tipo) - TIPOS.indexOf(b.tipo) || a.id - b.id
  const calzado = categorias.filter((c) => c.tipo === 'calzado').sort(orden)
  const ropa = categorias.filter((c) => COLGADOS.includes(c.tipo)).sort(orden)
  const otras = categorias.filter((c) => c.tipo !== 'calzado' && !COLGADOS.includes(c.tipo)).sort(orden)
  const out = []

  repartir(calzado.length, SALA.x0 + 0.8, SALA.x1 - 0.8, 0.45).forEach(({ centro, largo }, i) =>
    out.push({ categoria: calzado[i], tipo: 'repisa', centro: [centro, SALA.z0], dir: [1, 0], normal: [0, 1], largo }))

  const izq = ropa.slice(0, Math.ceil(ropa.length / 2))
  const der = ropa.slice(izq.length)
  repartir(izq.length, SALA.z0 + 1.2, 5.6, 0.5).forEach(({ centro, largo }, i) =>
    out.push({ categoria: izq[i], tipo: 'riel', centro: [SALA.x0, centro], dir: [0, 1], normal: [1, 0], largo }))
  repartir(der.length, SALA.z0 + 1.2, 5.9, 0.5).forEach(({ centro, largo }, i) =>
    out.push({ categoria: der[i], tipo: 'riel', centro: [SALA.x1, centro], dir: [0, 1], normal: [-1, 0], largo }))

  otras.forEach((c, i) => {
    const [x, z] = MESAS[i % MESAS.length]
    out.push({ categoria: c, tipo: 'mesa', centro: [x, z], dir: [1, 0], normal: [0, 1], largo: 2.4 })
  })
  return out.map((s) => ({ ...s, rotY: Math.atan2(s.normal[0], s.normal[1]) }))
}

const FILAS_REPISA = [1.25, 0.85, 1.65, 0.45, 2.05] // primero la repisa a la altura de la vista
export const ALTURAS_REPISA = [0.45, 0.85, 1.25, 1.65, 2.05]
export const RIEL_Y = 1.93

/** Posición de cada producto dentro de su sección y el punto desde donde se lo mira. */
export function ubicar(secciones, productos) {
  const slots = []
  for (const s of secciones) {
    const items = productos.filter((p) => p.categoria_id === s.categoria.id)
    const [cx, cz] = s.centro, [dx, dz] = s.dir, [nx, nz] = s.normal
    const punto = (a, sep) => [cx + dx * a + nx * sep, cz + dz * a + nz * sep]

    if (s.tipo === 'repisa') {
      const paso = 0.5
      const porFila = Math.max(1, Math.floor((s.largo - 0.3) / paso))
      items.slice(0, porFila * FILAS_REPISA.length).forEach((p, i) => {
        const fila = Math.floor(i / porFila)
        const enFila = Math.min(porFila, items.length - fila * porFila)
        const a = ((i % porFila) - (enFila - 1) / 2) * paso
        const [x, z] = punto(a, 0.21)
        slots.push({ producto: p, seccion: s, pos: [x, FILAS_REPISA[fila] + 0.025, z], rotY: s.rotY + 0.35, escala: 0.32, vista: punto(a, 2.1), mirarY: FILAS_REPISA[fila] + 0.1 })
      })
    } else if (s.tipo === 'riel') {
      const paso = 0.84
      const cap = Math.max(1, Math.floor((s.largo - 0.2) / paso))
      items.slice(0, cap).forEach((p, i) => {
        const a = (i - (Math.min(cap, items.length) - 1) / 2) * paso
        const [x, z] = punto(a, 0.34)
        slots.push({ producto: p, seccion: s, pos: [x, RIEL_Y - 0.06, z], rotY: s.rotY, escala: 1, vista: punto(a, 2.9), mirarY: 1.5 })
      })
    } else {
      items.slice(0, 8).forEach((p, i) => {
        const fila = Math.floor(i / 4)
        const x = cx + ((i % 4) - 1.5) * 0.52
        const z = cz + (fila === 0 ? 0.22 : -0.22)
        slots.push({ producto: p, seccion: s, pos: [x, 0.97, z], rotY: i % 2 ? -0.5 : 0.5, escala: 1, vista: [x, cz + 1.9], mirarY: 0.95 })
      })
    }
  }
  return slots
}

/** Cajas que el jugador no puede atravesar: [xmin, xmax, zmin, zmax]. */
export function obstaculos(secciones) {
  const cajas = []
  const caja = (x, z, ax, az) => cajas.push([x - ax, x + ax, z - az, z + az])
  for (const s of secciones) if (s.tipo === 'mesa') caja(s.centro[0], s.centro[1], 1.25 + 0.3, 0.5 + 0.3)
  caja(PODIO.x, PODIO.z, PODIO.r + 0.3, PODIO.r + 0.3)
  caja(CAJA.x, CAJA.z, CAJA.ancho / 2 + 0.3, CAJA.fondo / 2 + 0.3)
  cajas.push([PROBADORES.x0, PROBADORES.x1 + 0.3, PROBADORES.z0 - 0.3, PROBADORES.z1])
  for (const [x, z] of PUFS) caja(x, z, 0.62, 0.62)
  for (const [x, z] of PLANTAS) caja(x, z, 0.55, 0.55)
  return cajas
}

export const LIMITES = { x0: SALA.x0 + 0.75, x1: SALA.x1 - 0.75, z0: SALA.z0 + 0.8, z1: SALA.z1 - 0.55 }

export function libre(x, z, cajas) {
  if (x < LIMITES.x0 || x > LIMITES.x1 || z < LIMITES.z0 || z > LIMITES.z1) return false
  return !cajas.some(([a, b, c, d]) => x > a && x < b && z > c && z < d)
}
