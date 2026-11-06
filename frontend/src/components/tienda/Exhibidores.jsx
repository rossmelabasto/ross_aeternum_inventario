import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Text } from '@react-three/drei'
import { Modelo3D, cuelga } from '../modelos/Modelo3D.jsx'
import { Gancho } from '../modelos/Prendas.jsx'
import { bs } from '../../lib/api.js'
import { ALTURAS_REPISA, RIEL_Y } from './layout.js'
import { fuente } from './Sala.jsx'

function Letrero({ texto, cantidad, y, z = 0.08, c, tam = 0.24, dobleCara = false }) {
  // Con dos caras, cada texto queda pegado a su lado del cartel y el cartel tapa el de atrás
  const contenido = (rot) => (
    <group rotation={[0, rot, 0]} position={dobleCara ? [0, 0, rot ? -0.025 : 0.025] : [0, 0, 0]}>
      <Text font={fuente} fontSize={tam} position={[0, 0, 0]} anchorX="center" anchorY="middle" color={c.texto} letterSpacing={-0.01}>
        {texto}
      </Text>
      <Text font={fuente} fontSize={tam * 0.5} position={[0, -tam * 0.85, 0]} anchorX="center" anchorY="middle">
        {`${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`}
        <meshBasicMaterial color={c.acento} toneMapped={false} />
      </Text>
    </group>
  )
  return (
    <group position={[0, y, z]}>
      {contenido(0)}
      {dobleCara && contenido(Math.PI)}
    </group>
  )
}

function Repisa({ s, c, cantidad }) {
  const L = s.largo
  return (
    <group>
      <mesh position={[0, 1.3, 0.02]}>
        <boxGeometry args={[L, 2.35, 0.04]} />
        <meshStandardMaterial color={c.panel} roughness={0.9} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[(k * L) / 2, 1.3, 0.2]}>
          <boxGeometry args={[0.04, 2.35, 0.4]} />
          <meshStandardMaterial color={c.madera} roughness={0.7} />
        </mesh>
      ))}
      {ALTURAS_REPISA.map((y) => (
        <group key={y} position={[0, y, 0.21]}>
          <mesh>
            <boxGeometry args={[L - 0.04, 0.03, 0.38]} />
            <meshStandardMaterial color={c.madera} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.02, 0.17]}>
            <boxGeometry args={[L - 0.12, 0.008, 0.012]} />
            <meshBasicMaterial color={c.acento} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <Letrero texto={s.categoria.nombre} cantidad={cantidad} y={2.68} c={c} />
    </group>
  )
}

function Riel({ s, c, cantidad }) {
  const L = s.largo
  return (
    <group>
      <mesh position={[0, 1.45, 0.015]}>
        <boxGeometry args={[L, 2.1, 0.03]} />
        <meshStandardMaterial color={c.panel} roughness={0.9} />
      </mesh>
      <mesh position={[0, RIEL_Y, 0.34]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, L - 0.1, 12]} />
        <meshStandardMaterial color={c.metal} metalness={0.7} roughness={0.3} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[(k * (L - 0.14)) / 2, RIEL_Y, 0.18]}>
          <boxGeometry args={[0.03, 0.03, 0.34]} />
          <meshStandardMaterial color={c.metal} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0.035]}>
        <boxGeometry args={[L - 0.2, 0.008, 0.012]} />
        <meshBasicMaterial color={c.acento} toneMapped={false} />
      </mesh>
      <Letrero texto={s.categoria.nombre} cantidad={cantidad} y={2.68} c={c} />
    </group>
  )
}

function Mesa({ s, c, cantidad }) {
  return (
    <group>
      <mesh position={[0, 0.39, 0]}>
        <boxGeometry args={[2.2, 0.78, 0.72]} />
        <meshStandardMaterial color={c.panel} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.81, 0]}>
        <boxGeometry args={[2.5, 0.06, 1.0]} />
        <meshStandardMaterial color={c.madera} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.07, 0.37]}>
        <boxGeometry args={[2.1, 0.01, 0.01]} />
        <meshBasicMaterial color={c.acento} toneMapped={false} />
      </mesh>
      {/* Letrero colgado del techo, visible de ambos lados */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 3.05, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 1.1, 4]} />
          <meshStandardMaterial color={c.metal} />
        </mesh>
      ))}
      <mesh position={[0, 2.38, 0]}>
        <boxGeometry args={[1.5, 0.5, 0.03]} />
        <meshStandardMaterial color={c.panel} />
      </mesh>
      <Letrero texto={s.categoria.nombre} cantidad={cantidad} y={2.42} z={0} c={c} tam={0.17} dobleCara />
    </group>
  )
}

const MUEBLES = { repisa: Repisa, riel: Riel, mesa: Mesa }

function Producto({ slot, activo, onHover, onElegir }) {
  const ref = useRef()
  const p = slot.producto
  useFrame((_, dt) => {
    if (!ref.current) return
    const e = activo ? 1.07 : 1
    const k = Math.min(1, dt * 10)
    ref.current.scale.setScalar(ref.current.scale.x + (e - ref.current.scale.x) * k)
  })
  return (
    <group position={slot.pos} rotation={[0, slot.rotY, 0]}>
      <group
        ref={ref}
        onPointerOver={(e) => { e.stopPropagation(); onHover(slot); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); if (e.delta < 8) onElegir(slot) }}
      >
        <group scale={slot.escala}>
          {cuelga(p.tipo) && <Gancho ancho={p.tipo === 'pantalon' ? 0.44 : 0.4} />}
          <Modelo3D producto={p} agotado={p.stock === 0} />
        </group>
      </group>
      {p.tipo === 'gorra' && (
        <mesh position={[0, -0.075, 0]}>
          <cylinderGeometry args={[0.045, 0.06, 0.15, 16]} />
          <meshStandardMaterial color="#8b8b93" roughness={0.6} />
        </mesh>
      )}
    </group>
  )
}

/** Altura de la parte de arriba del producto (para el marcador y la etiqueta). */
export const tope = (slot) => {
  const t = slot.producto.tipo
  if (cuelga(t)) return slot.pos[1] + 0.2
  if (t === 'gorra') return slot.pos[1] + 0.2
  return slot.pos[1] + 0.1
}

function Marcador({ slot, c }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = tope(slot) + 0.14 + Math.sin(clock.elapsedTime * 3) * 0.03
      ref.current.rotation.y = clock.elapsedTime * 1.5
    }
  })
  return (
    <group ref={ref} position={[slot.pos[0], tope(slot) + 0.18, slot.pos[2]]}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.07, 0.16, 4]} />
        <meshBasicMaterial color={c.acento} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function Exhibidores({ secciones, slots, c, hover, seleccion, onHover, onElegir }) {
  return (
    <>
      {secciones.map((s) => {
        const M = MUEBLES[s.tipo]
        const cantidad = slots.filter((x) => x.seccion === s).length
        return (
          <group key={s.categoria.id} position={[s.centro[0], 0, s.centro[1]]} rotation={[0, s.rotY, 0]}>
            <M s={s} c={c} cantidad={cantidad} />
          </group>
        )
      })}
      {slots.map((slot) => (
        <Producto key={slot.producto.id} slot={slot} activo={hover?.producto.id === slot.producto.id || seleccion?.producto.id === slot.producto.id} onHover={onHover} onElegir={onElegir} />
      ))}
      {seleccion && <Marcador slot={seleccion} c={c} />}
      {hover && hover.producto.id !== seleccion?.producto.id && (
        <Html position={[hover.pos[0], tope(hover) + 0.12, hover.pos[2]]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="entra bg-panel/95 border-borde w-48 rounded-xl border px-3 py-2 text-sm shadow-xl backdrop-blur">
            <div className="text-tenue font-mono text-[10px] uppercase">{hover.producto.marca} · talla {hover.producto.talla}</div>
            <div className="font-display text-texto font-semibold leading-tight">{hover.producto.nombre}</div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-acento font-mono font-semibold">{bs(hover.producto.precio)}</span>
              <span className={hover.producto.stock ? 'text-tenue' : 'text-peligro'}>{hover.producto.stock ? `stock ${hover.producto.stock}` : 'agotado'}</span>
            </div>
          </div>
        </Html>
      )}
    </>
  )
}
