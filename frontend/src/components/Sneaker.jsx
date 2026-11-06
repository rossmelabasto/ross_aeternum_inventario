import { useMemo } from 'react'
import * as THREE from 'three'
import { alturaCuello, coloresDe } from '../lib/colores.js'

export { coloresDe }

const MEDIO_ANCHO = 0.19 // la zapatilla mide 1 de largo y ~0.38 de ancho
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

/** Ancho relativo según el largo: angosta en el talón y la punta, ancha en la planta. */
const anchoLargo = (x) => 0.62 + 0.38 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, x * 0.92 + 0.04))), 0.55)
/** La capellada se cierra hacia arriba (sobre todo en el empeine). */
const anchoAlto = (y, cuello) => 1 - 0.42 * smooth(0.12, cuello, y)

function perfilCapellada(c) {
  const s = new THREE.Shape()
  s.moveTo(0.03, 0.1)
  s.bezierCurveTo(-0.03, 0.18, -0.02, c - 0.08, 0.05, c) // talón
  s.quadraticCurveTo(0.15, c + 0.03, 0.25, c - 0.03) // cuello
  s.quadraticCurveTo(0.33, c - 0.05, 0.4, c + 0.01) // lengüeta
  s.bezierCurveTo(0.5, c - 0.04, 0.6, 0.27, 0.78, 0.235) // empeine
  s.bezierCurveTo(0.9, 0.22, 1.0, 0.2, 1.0, 0.13) // puntera
  s.lineTo(0.98, 0.1)
  s.lineTo(0.03, 0.1)
  return s
}

function perfilSuela() {
  const s = new THREE.Shape()
  s.moveTo(0.05, 0)
  s.lineTo(0.9, 0)
  s.quadraticCurveTo(1.04, 0.0, 1.03, 0.08)
  s.lineTo(1.01, 0.11)
  s.lineTo(0.0, 0.11)
  s.quadraticCurveTo(-0.04, 0.04, 0.05, 0)
  return s
}

/**
 * Angosta la geometría en Z con un factor k(x, y). En las caras laterales (normal ±Z)
 * la normal se recalcula de forma analítica con la derivada de k: así el sombreado
 * queda suave aunque los triángulos de la tapa sean largos.
 */
function angostar(g, k) {
  const p = g.attributes.position
  const n0 = g.attributes.normal.array.slice()
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * k(p.getX(i), p.getY(i)))
  g.computeVertexNormals()
  const n = g.attributes.normal
  const e = 1e-3
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    if (Math.abs(n0[i * 3 + 2]) < 0.999) continue
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const k0 = k(x, y)
    const z0 = z / k0
    const kx = (k(x + e, y) - k(x - e, y)) / (2 * e)
    const ky = (k(x, y + e) - k(x, y - e)) / (2 * e)
    v.set(-z0 * kx, -z0 * ky, 1).multiplyScalar(Math.sign(z0) || 1).normalize()
    n.setXYZ(i, v.x, v.y, v.z)
  }
  return g
}

/** Extruye el perfil lateral y lo deforma para que no sea un bloque recto. */
function extruir(shape, { bisel, cuello, cerrarArriba, ancho = 1 }) {
  const prof = MEDIO_ANCHO * 2 * ancho - bisel * 2
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: prof, bevelEnabled: true, bevelSize: bisel, bevelThickness: bisel, bevelSegments: 5, curveSegments: 28,
  })
  g.translate(0, 0, -prof / 2)
  return angostar(g, (x, y) => anchoLargo(x) * (cerrarArriba ? anchoAlto(y, cuello) : 1))
}

/** Altura del borde superior de la capellada en cierto punto del largo. */
function techo(shape, x) {
  let mejor = 0
  for (const pt of shape.getPoints(64)) if (Math.abs(pt.x - x) < 0.03 && pt.y > mejor) mejor = pt.y
  return mejor
}

function geometrias(cuello) {
  const capellada = perfilCapellada(cuello)

  // Franja lateral: se pega a la superficie siguiendo el mismo ancho deformado
  const f = new THREE.Shape()
  f.moveTo(0.16, 0.13)
  f.quadraticCurveTo(0.55, 0.1, 0.84, 0.19)
  f.quadraticCurveTo(0.56, 0.18, 0.26, 0.25)
  f.lineTo(0.16, 0.13)
  const franja = (lado) => {
    const g = new THREE.ShapeGeometry(f, 24)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setZ(i, lado * (MEDIO_ANCHO * 0.92 + 0.004))
    g.attributes.normal.array.forEach((_, j, arr) => { if (j % 3 === 2) arr[j] = lado })
    return angostar(g, (x, y) => anchoLargo(x) * anchoAlto(y, cuello))
  }

  const cordones = [0, 1, 2, 3].map((i) => {
    const x = 0.45 + i * 0.075
    return [x, techo(capellada, x), MEDIO_ANCHO * 0.92 * anchoLargo(x) * anchoAlto(techo(capellada, x), cuello) * 1.5]
  })

  return {
    suela: extruir(perfilSuela(), { bisel: 0.03, ancho: 1.03 }),
    capellada: extruir(capellada, { bisel: 0.045, cuello, cerrarArriba: true, ancho: 0.92 }),
    franjas: [franja(1), franja(-1)],
    cordones,
    boca: [0.17, techo(capellada, 0.17)],
  }
}

/**
 * Zapatilla esquemática armada con formas extruidas (sin modelos externos).
 * Mide ~1 unidad de largo; el origen queda en el centro de la suela.
 */
export function Sneaker({ producto, escala = 1, agotado = false, ...props }) {
  const cuello = alturaCuello(producto)
  const g = useMemo(() => geometrias(cuello), [cuello])
  const [cCapellada, cSuela, cFranja] = coloresDe(producto)
  const mat = { transparent: agotado, opacity: agotado ? 0.25 : 1, depthWrite: !agotado }
  const cCordon = cFranja === '#afff00' ? '#f2f2ee' : cFranja

  return (
    <group scale={escala} {...props}>
      <group position={[-0.5, 0, 0]}>
        <mesh geometry={g.suela} castShadow>
          <meshStandardMaterial color={cSuela} roughness={0.85} {...mat} />
        </mesh>
        <mesh geometry={g.capellada} castShadow>
          <meshStandardMaterial color={cCapellada} roughness={0.55} {...mat} />
        </mesh>
        {g.franjas.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial color={cFranja} roughness={0.4} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} {...mat} />
          </mesh>
        ))}
        {/* Boca del calzado */}
        <mesh position={[g.boca[0], g.boca[1] + 0.047, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.5, 0.75, 1]}>
          <circleGeometry args={[0.075, 28]} />
          <meshStandardMaterial color="#0b0b0c" side={THREE.DoubleSide} {...mat} />
        </mesh>
        {g.cordones.map(([x, y, ancho], i) => (
          <mesh key={i} position={[x, y + 0.05, 0]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.022, 0.012, ancho]} />
            <meshStandardMaterial color={cCordon} roughness={0.6} {...mat} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
