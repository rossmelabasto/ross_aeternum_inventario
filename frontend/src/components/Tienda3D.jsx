import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Grid, Html, OrbitControls } from '@react-three/drei'
import { Sneaker } from './Sneaker.jsx'
import { bs } from '../lib/api.js'
import { ir } from '../lib/useHash.js'
import { colores3D } from '../lib/useTema.js'

const POR_REPISA = 3
const REPISAS = [0.55, 1.3, 2.05]
// Se llena primero la repisa a la altura de la vista, luego la de abajo y la de arriba
const ORDEN = [1, 0, 2]
const ANCHO_MUEBLE = 2.6

/** Un estante (mueble) por categoría, con sus zapatillas repartidas en 3 repisas. */
function Estante({ categoria, productos, posicion, rotacion, c, onHover, hover }) {
  return (
    <group position={posicion} rotation={[0, rotacion, 0]}>
      {/* Laterales y fondo */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * ANCHO_MUEBLE) / 2, 1.35, 0]} castShadow>
          <boxGeometry args={[0.08, 2.7, 0.7]} />
          <meshStandardMaterial color={c.mueble} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 1.35, -0.33]}>
        <boxGeometry args={[ANCHO_MUEBLE, 2.7, 0.04]} />
        <meshStandardMaterial color={c.pared} roughness={0.9} />
      </mesh>
      {REPISAS.map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[ANCHO_MUEBLE, 0.05, 0.66]} />
            <meshStandardMaterial color={c.mueble} roughness={0.6} />
          </mesh>
          {/* Tira LED bajo cada repisa */}
          <mesh position={[0, -0.035, 0.3]}>
            <boxGeometry args={[ANCHO_MUEBLE - 0.12, 0.012, 0.02]} />
            <meshStandardMaterial color={c.acento} emissive={c.acento} emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <spotLight position={[0, 3.6, 1.6]} angle={0.55} penumbra={0.8} intensity={c.claro ? 8 : 14} distance={7} target-position={[0, 1, 0]} />
      <Html position={[0, 2.95, 0]} center distanceFactor={9} zIndexRange={[10, 0]}>
        <div className="font-display text-texto whitespace-nowrap text-2xl font-semibold tracking-tight select-none">
          {categoria.nombre}
          <span className="text-acento ml-2 font-mono text-base">{productos.length}</span>
        </div>
      </Html>
      {productos.slice(0, POR_REPISA * REPISAS.length).map((p, i) => {
        const fila = ORDEN[Math.floor(i / POR_REPISA)]
        const col = i % POR_REPISA
        const x = -ANCHO_MUEBLE / 2 + 0.48 + col * ((ANCHO_MUEBLE - 0.96) / (POR_REPISA - 1))
        return (
          <Par
            key={p.id}
            producto={p}
            position={[x, REPISAS[fila] + 0.03, 0.02]}
            activo={hover?.id === p.id}
            onHover={onHover}
          />
        )
      })}
    </group>
  )
}

function Par({ producto, position, activo, onHover }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (!ref.current) return
    const objetivo = activo ? 0.6 : 0.35
    ref.current.rotation.y += (objetivo - ref.current.rotation.y) * Math.min(1, dt * 8)
    const y = activo ? 0.06 : 0
    ref.current.position.y += (y - ref.current.position.y) * Math.min(1, dt * 8)
  })
  return (
    <group position={position}>
      <group
        ref={ref}
        onPointerOver={(e) => { e.stopPropagation(); onHover(producto); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); document.body.style.cursor = ''; ir(`/visor/${producto.id}`) }}
      >
        <Sneaker producto={producto} escala={0.62} agotado={producto.stock === 0} />
      </group>
      {activo && (
        <Html position={[0, 0.62, 0.2]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="entra bg-panel/95 border-borde w-52 rounded-xl border p-3 text-sm shadow-xl backdrop-blur">
            <div className="text-tenue font-mono text-[11px] uppercase">{producto.marca} · talla {Number(producto.talla)}</div>
            <div className="font-display text-texto text-base font-semibold leading-tight">{producto.nombre}</div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-acento font-mono font-semibold">{bs(producto.precio)}</span>
              <span className={producto.stock ? 'text-tenue' : 'text-peligro'}>
                {producto.stock ? `${producto.stock} en stock` : 'Agotado'}
              </span>
            </div>
            <div className="text-tenue mt-1 text-[11px]">Clic para verlo en 3D</div>
          </div>
        </Html>
      )}
    </group>
  )
}

/** Podio central que gira con el par más caro con stock. */
function Podio({ producto, c }) {
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.5 })
  if (!producto) return null
  return (
    <group position={[0, 0, 1.7]}>
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.62, 0.7, 0.3, 48]} />
        <meshStandardMaterial color={c.mueble} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.305, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.54, 0.58, 64]} />
        <meshStandardMaterial color={c.acento} emissive={c.acento} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <group ref={ref} position={[0, 0.32, 0]}>
        <Sneaker producto={producto} escala={0.85} />
      </group>
      <Html position={[0, 0.15, 0.75]} center distanceFactor={7} zIndexRange={[10, 0]}>
        <button
          onClick={() => ir(`/visor/${producto.id}`)}
          className="bg-panel/90 border-borde hover:border-acento cursor-pointer whitespace-nowrap rounded-full border px-4 py-1.5 text-center backdrop-blur transition"
        >
          <span className="text-acento font-mono text-xs uppercase">Destacado</span>
          <span className="font-display text-texto ml-2 font-semibold">{producto.nombre}</span>
        </button>
      </Html>
    </group>
  )
}

function Sala({ c }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={c.piso} roughness={0.95} />
      </mesh>
      <Grid
        position={[0, 0.002, 0]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor={c.linea}
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor={c.linea}
        fadeDistance={22}
        fadeStrength={1.5}
        infiniteGrid
      />
      <mesh position={[0, 3.5, -3.4]}>
        <planeGeometry args={[30, 7]} />
        <meshStandardMaterial color={c.pared} roughness={1} />
      </mesh>
    </>
  )
}

export default function Tienda3D({ categorias, productos, tema, cargando, error }) {
  const c = colores3D(tema)
  const [hover, setHover] = useState(null)

  const grupos = useMemo(
    () => categorias.map((cat) => ({ categoria: cat, productos: productos.filter((p) => p.categoria_id === cat.id) })),
    [categorias, productos],
  )
  const destacado = useMemo(
    () => [...productos].filter((p) => p.stock > 0).sort((a, b) => b.precio - a.precio)[0],
    [productos],
  )

  // Estantes en arco frente a la cámara
  const n = grupos.length
  const ubicar = (i) => {
    const t = n === 1 ? 0 : i / (n - 1) - 0.5
    const ang = t * 1.1
    const r = 3.9
    return { pos: [Math.sin(ang) * r, 0, -Math.cos(ang) * r + 1.3], rot: -ang }
  }

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2.05, 6.3], fov: 50 }}>
        <color attach="background" args={[c.fondo]} />
        <fog attach="fog" args={[c.fondo, 12, 24]} />
        <hemisphereLight intensity={tema === 'claro' ? 1.3 : 1.0} groundColor={c.piso} />
        <directionalLight position={[4, 8, 5]} intensity={tema === 'claro' ? 1.6 : 1.2} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[0, 2.5, 2]} intensity={6} distance={7} color={c.acento} />
        {/* El primer <Html> que monta drei (v10 + React 19) queda vacío: este absorbe el fallo */}
        <Html><span /></Html>
          <Sala c={c} />
          {grupos.map((g, i) => {
            const { pos, rot } = ubicar(i)
            return <Estante key={g.categoria.id} {...g} posicion={pos} rotacion={rot} c={c} onHover={setHover} hover={hover} />
          })}
          <Podio producto={destacado} c={c} />
          <ContactShadows position={[0, 0.01, 1.7]} opacity={0.5} scale={4} blur={2.4} far={1.5} />
        <OrbitControls
          target={[0, 1.05, 0]}
          enablePan={false}
          minDistance={4}
          maxDistance={10}
          minPolarAngle={0.6}
          maxPolarAngle={1.45}
          minAzimuthAngle={-0.8}
          maxAzimuthAngle={0.8}
          enableDamping
        />
      </Canvas>

      {/* Capa de interfaz sobre el canvas */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-8">
        <div className="entra max-w-sm">
          <p className="text-acento font-mono text-xs uppercase tracking-widest">Tienda 3D · inventario en vivo</p>
          <h1 className="font-display mt-1 text-3xl font-bold leading-none tracking-tight sm:text-5xl">Tenis con historia.</h1>
          <p className="text-tenue mt-2 text-sm sm:text-base">
            Cada par de los estantes viene de la base de datos en Supabase. Pasa el mouse encima para ver su precio
            o haz clic para girarlo en 3D. Los pares transparentes están agotados.
          </p>
          {cargando && <p className="text-tenue pulso mt-3 font-mono text-sm">cargando inventario…</p>}
          {error && <p className="text-peligro mt-3 font-mono text-sm">{error}</p>}
        </div>
        <div className="flex items-end justify-between gap-4">
          <p className="text-tenue hidden font-mono text-xs sm:block">arrastra para mirar · rueda para acercar</p>
          <button
            onClick={() => ir('/panel')}
            className="bg-acento text-acento-texto font-display pointer-events-auto ml-auto flex cursor-pointer items-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold shadow-lg transition hover:scale-[1.03] active:scale-[.98]"
          >
            Panel de ventas
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
