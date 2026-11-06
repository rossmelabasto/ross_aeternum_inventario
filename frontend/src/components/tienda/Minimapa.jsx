import { useEffect, useState } from 'react'
import { CAJA, PODIO, PROBADORES, PUERTA, SALA } from './layout.js'

const E = 10 // píxeles por metro
const W = (SALA.x1 - SALA.x0) * E
const H = (SALA.z1 - SALA.z0) * E
const px = (x) => (x - SALA.x0) * E
const pz = (z) => (z - SALA.z0) * E

const corto = (n) => n.slice(0, 3).toUpperCase()

/** Plano visto desde arriba: secciones, muebles, tu posición y el producto elegido. Clic para ir. */
export function Minimapa({ secciones, estado, seleccion, onIr }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 90)
    return () => clearInterval(id)
  }, [])

  function clic(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const x = SALA.x0 + ((e.clientX - r.left) / r.width) * (W / E)
    const z = SALA.z0 + ((e.clientY - r.top) / r.height) * (H / E)
    onIr(x, z)
  }

  return (
    <div className="bg-panel/90 border-borde pointer-events-auto rounded-2xl border p-2 shadow-xl backdrop-blur">
      <svg viewBox={`-6 -6 ${W + 12} ${H + 12}`} className="block h-auto w-32 cursor-crosshair sm:w-40" onClick={clic} role="img" aria-label="Plano de la tienda">
        <rect x="0" y="0" width={W} height={H} rx="3" className="fill-panel-2 stroke-borde" strokeWidth="1.5" />
        <line x1={px(-PUERTA)} y1={H} x2={px(PUERTA)} y2={H} className="stroke-acento" strokeWidth="3" />
        {secciones.map((s) => {
          const [cx, cz] = s.centro, [dx, dz] = s.dir, [nx, nz] = s.normal
          if (s.tipo === 'mesa') {
            return (
              <g key={s.categoria.id}>
                <rect x={px(cx - 1.25)} y={pz(cz - 0.5)} width={25} height={10} rx="2" className="fill-borde" />
                <text x={px(cx)} y={pz(cz) + 3} textAnchor="middle" className="fill-texto font-mono" fontSize="7">{corto(s.categoria.nombre)}</text>
              </g>
            )
          }
          const a = s.largo / 2
          const off = 0.15
          const x1 = px(cx - dx * a + nx * off), y1 = pz(cz - dz * a + nz * off)
          const x2 = px(cx + dx * a + nx * off), y2 = pz(cz + dz * a + nz * off)
          const tx = px(cx + nx * 0.9), ty = pz(cz + nz * 0.9)
          return (
            <g key={s.categoria.id}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-acento" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
              <text x={tx} y={ty + 3} textAnchor="middle" className="fill-tenue font-mono" fontSize="7"
                transform={s.tipo === 'riel' ? `rotate(-90 ${tx} ${ty})` : undefined}>{corto(s.categoria.nombre)}</text>
            </g>
          )
        })}
        <circle cx={px(PODIO.x)} cy={pz(PODIO.z)} r={PODIO.r * E} className="fill-borde" />
        <rect x={px(CAJA.x - CAJA.ancho / 2)} y={pz(CAJA.z - CAJA.fondo / 2)} width={CAJA.ancho * E} height={CAJA.fondo * E} rx="2" className="fill-borde" />
        <text x={px(CAJA.x)} y={pz(CAJA.z) + 3} textAnchor="middle" className="fill-tenue font-mono" fontSize="6">CAJA</text>
        <rect x={px(PROBADORES.x0)} y={pz(PROBADORES.z0)} width={(PROBADORES.x1 - PROBADORES.x0) * E} height={(PROBADORES.z1 - PROBADORES.z0) * E} className="fill-borde" opacity="0.7" />
        {seleccion && (
          <circle cx={px(seleccion.pos[0])} cy={pz(seleccion.pos[2])} r="5" className="fill-acento pulso" />
        )}
        <g transform={`translate(${px(estado.x)} ${pz(estado.z)}) rotate(${(-estado.yaw * 180) / Math.PI})`}>
          <path d="M0 -8 L5.5 5 L0 2.5 L-5.5 5 Z" className="fill-texto stroke-panel" strokeWidth="1" />
        </g>
      </svg>
    </div>
  )
}
