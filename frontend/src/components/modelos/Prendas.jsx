import * as THREE from 'three'
import { coloresDe, matiz } from '../../lib/colores.js'

/*
 * Prendas esquemáticas armadas con formas extruidas de Three.js.
 * Las prendas tienen el origen arriba al centro (donde va el gancho) y miran hacia +Z.
 * Medidas en metros, como en la tienda.
 */

const GROSOR = 0.035
const cache = new Map()
const una = (clave, crear) => { if (!cache.has(clave)) cache.set(clave, crear()); return cache.get(clave) }

function extruir(shape, grosor = GROSOR, bisel = 0.018) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: grosor, bevelEnabled: true, bevelSize: bisel, bevelThickness: bisel, bevelSegments: 4, curveSegments: 16,
  })
  g.translate(0, 0, -grosor / 2)
  return g
}

/** Dibuja un contorno simétrico a partir de la mitad derecha (de arriba hacia abajo). */
function simetrico(mitad) {
  const s = new THREE.Shape()
  const [x0, y0] = mitad[0]
  s.moveTo(-x0, y0)
  s.quadraticCurveTo(0, y0 - 0.075, x0, y0) // escote
  for (const [x, y] of mitad.slice(1)) s.lineTo(x, y)
  const resto = mitad.slice(1)
  if (resto.at(-1)[0] === 0) resto.pop() // el punto central del ruedo no se repite
  for (const [x, y] of resto.reverse()) s.lineTo(-x, y)
  s.lineTo(-x0, y0)
  return s
}

const FRENTE = GROSOR / 2 + 0.019

function material(color, agotado, extra = {}) {
  return <meshStandardMaterial color={color} roughness={0.85} transparent={agotado} opacity={agotado ? 0.25 : 1} depthWrite={!agotado} {...extra} />
}

/** Gancho de ropa (detrás de la prenda). */
export function Gancho({ ancho = 0.4 }) {
  return (
    <group position={[0, 0.005, -0.03]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.006, ancho, 8]} />
        <meshStandardMaterial color="#b9b9bf" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <torusGeometry args={[0.022, 0.004, 6, 16, Math.PI * 1.4]} />
        <meshStandardMaterial color="#b9b9bf" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  )
}

function Escote({ color, agotado, y = -0.012 }) {
  return (
    <mesh position={[0, y, FRENTE - 0.004]} scale={[1, 0.42, 1]} rotation={[0, 0, Math.PI]}>
      <torusGeometry args={[0.09, 0.011, 8, 24, Math.PI]} />
      {material(color, agotado)}
    </mesh>
  )
}

export function Polera({ producto, agotado }) {
  const [c, c2, detalle] = coloresDe(producto)
  const g = una('polera', () => extruir(simetrico([[0.09, 0], [0.2, -0.025], [0.35, -0.14], [0.28, -0.25], [0.205, -0.2], [0.215, -0.68], [0.0, -0.7]])))
  return (
    <group>
      <mesh geometry={g}>{material(c, agotado)}</mesh>
      <Escote color={c2} agotado={agotado} />
      {/* Estampado del pecho */}
      <mesh position={[0, -0.22, FRENTE + 0.001]}>
        <planeGeometry args={[0.16, 0.06]} />
        {material(detalle, agotado, { roughness: 0.6 })}
      </mesh>
    </group>
  )
}

const MITAD_ABRIGO = [[0.09, 0], [0.22, -0.04], [0.33, -0.2], [0.37, -0.62], [0.29, -0.65], [0.25, -0.26], [0.235, -0.7], [0.0, -0.72]]

export function Hoodie({ producto, agotado }) {
  const [c, c2, detalle] = coloresDe(producto)
  const g = una('hoodie', () => extruir(simetrico(MITAD_ABRIGO)))
  const bolsillo = una('bolsillo', () => {
    const s = new THREE.Shape()
    s.moveTo(-0.15, 0); s.lineTo(0.15, 0); s.lineTo(0.12, 0.13); s.lineTo(-0.12, 0.13); s.lineTo(-0.15, 0)
    return extruir(s, 0.004, 0.006)
  })
  return (
    <group>
      <mesh geometry={g}>{material(c, agotado)}</mesh>
      {/* Capucha caída detrás del cuello */}
      <mesh position={[0, -0.01, -0.03]} scale={[1, 0.75, 0.55]}>
        <sphereGeometry args={[0.15, 24, 16]} />
        {material(c2, agotado)}
      </mesh>
      <Escote color={c2} agotado={agotado} />
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, -0.1, FRENTE + 0.004]}>
          <cylinderGeometry args={[0.004, 0.004, 0.15, 6]} />
          {material(detalle, agotado)}
        </mesh>
      ))}
      <mesh geometry={bolsillo} position={[0, -0.6, FRENTE]}>{material(c2, agotado)}</mesh>
      {/* Puño inferior */}
      <mesh position={[0, -0.715, 0]}>
        <boxGeometry args={[0.47, 0.04, GROSOR + 0.04]} />
        {material(c2, agotado)}
      </mesh>
    </group>
  )
}

export function Chamarra({ producto, agotado }) {
  const [c, c2] = coloresDe(producto)
  const g = una('chamarra', () => extruir(simetrico(MITAD_ABRIGO)))
  const acolchada = /nuptse|puffer|plum/i.test(producto?.nombre || '')
  return (
    <group>
      <mesh geometry={g}>{material(c, agotado)}</mesh>
      {/* Cuello */}
      <mesh position={[0, -0.005, 0.005]}>
        <boxGeometry args={[0.22, 0.06, GROSOR + 0.05]} />
        {material(c2, agotado)}
      </mesh>
      {/* Cierre */}
      <mesh position={[0, -0.37, FRENTE + 0.002]}>
        <boxGeometry args={[0.012, 0.68, 0.004]} />
        <meshStandardMaterial color="#c9c9cf" metalness={0.8} roughness={0.3} transparent={agotado} opacity={agotado ? 0.25 : 1} />
      </mesh>
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, -0.28, FRENTE + 0.003]}>
          <boxGeometry args={[0.1, 0.08, 0.006]} />
          {material(c2, agotado)}
        </mesh>
      ))}
      {acolchada && [-0.2, -0.34, -0.48, -0.62].map((y) => (
        <mesh key={y} position={[0, y, FRENTE + 0.002]}>
          <boxGeometry args={[0.46, 0.008, 0.004]} />
          {material(matiz(c, -0.35), agotado)}
        </mesh>
      ))}
    </group>
  )
}

export function Pantalon({ producto, agotado }) {
  const [c, c2] = coloresDe(producto)
  const g = una('pantalon', () => {
    const s = new THREE.Shape()
    s.moveTo(-0.2, 0); s.lineTo(0.2, 0); s.lineTo(0.235, -0.98); s.lineTo(0.06, -0.98)
    s.lineTo(0, -0.32); s.lineTo(-0.06, -0.98); s.lineTo(-0.235, -0.98); s.lineTo(-0.2, 0)
    return extruir(s)
  })
  const jogger = /jogger|tech|firebird|track/i.test(producto?.nombre || '')
  return (
    <group>
      <mesh geometry={g}>{material(c, agotado)}</mesh>
      <mesh position={[0, -0.025, 0]}>
        <boxGeometry args={[0.44, 0.05, GROSOR + 0.045]} />
        {material(c2, agotado)}
      </mesh>
      {jogger
        ? [-0.15, 0.15].map((x) => (
            <mesh key={x} position={[x, -0.96, 0]}>
              <boxGeometry args={[0.18, 0.05, GROSOR + 0.04]} />
              {material(c2, agotado)}
            </mesh>
          ))
        : [-0.12, 0.12].map((x) => (
            <mesh key={x} position={[x, -0.1, FRENTE + 0.001]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]}>
              <planeGeometry args={[0.1, 0.006]} />
              {material(c2, agotado)}
            </mesh>
          ))}
    </group>
  )
}

/** Gorra con el origen en la base de la copa, visera hacia +Z. */
export function Gorra({ producto, agotado }) {
  const [c, c2, detalle] = coloresDe(producto)
  return (
    <group>
      <mesh scale={[1, 0.78, 1.08]}>
        <sphereGeometry args={[0.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {material(c, agotado, { side: THREE.DoubleSide })}
      </mesh>
      <mesh position={[0, 0.004, 0.1]} rotation={[0.18, 0, 0]} scale={[1, 1, 0.8]}>
        <cylinderGeometry args={[0.1, 0.1, 0.008, 32, 1, false, -Math.PI / 2, Math.PI]} />
        {material(c2, agotado)}
      </mesh>
      <mesh position={[0, 0.079, 0]}>
        <sphereGeometry args={[0.009, 8, 8]} />
        {material(c2, agotado)}
      </mesh>
      <mesh position={[0, 0.05, 0.091]} rotation={[-0.62, 0, 0]}>
        <circleGeometry args={[0.016, 20]} />
        {material(detalle, agotado, { roughness: 0.6 })}
      </mesh>
    </group>
  )
}
