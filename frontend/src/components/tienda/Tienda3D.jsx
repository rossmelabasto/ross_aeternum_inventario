import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Modelo3D } from '../modelos/Modelo3D.jsx'
import { bs } from '../../lib/api.js'
import { ir } from '../../lib/useHash.js'
import { colores3D } from '../../lib/useTema.js'
import { Detalle } from './Detalle.jsx'
import { Exhibidores } from './Exhibidores.jsx'
import { Jugador } from './Jugador.jsx'
import { Minimapa } from './Minimapa.jsx'
import { Sala } from './Sala.jsx'
import { INICIO, LIMITES, OJOS, libre, obstaculos, seccionesDe, ubicar } from './layout.js'

// La posición se conserva al ir al panel y volver
const control = { x: INICIO.x, z: INICIO.z, yaw: INICIO.yaw, pitch: INICIO.pitch, vx: 0, vz: 0, paso: 0, objetivo: null }
const MOVER = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']

function Girando({ children }) {
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.6 })
  return <group ref={ref}>{children}</group>
}

function Tecla({ children }) {
  return <kbd className="bg-panel-2 border-borde text-texto rounded-md border px-1.5 py-0.5 font-mono text-[11px]">{children}</kbd>
}

/** Botón de la cruceta táctil: mantiene la tecla "pulsada" mientras se presiona. */
function Boton({ codigo, teclas, children, className = '' }) {
  const on = (e) => { e.preventDefault(); teclas.current.add(codigo) }
  const off = () => teclas.current.delete(codigo)
  return (
    <button onPointerDown={on} onPointerUp={off} onPointerLeave={off} onPointerCancel={off}
      className={`bg-panel/90 border-borde active:bg-acento active:text-acento-texto grid h-12 w-12 select-none place-items-center rounded-xl border text-lg backdrop-blur ${className}`}>
      {children}
    </button>
  )
}

export default function Tienda3D({ categorias, productos, tema, cargando, error, onVender, vendiendo }) {
  const c = colores3D(tema)
  const secciones = useMemo(() => seccionesDe(categorias), [categorias])
  const slots = useMemo(() => ubicar(secciones, productos), [secciones, productos])
  const cajas = useMemo(() => obstaculos(secciones), [secciones])
  const teclas = useRef(new Set())

  const [hover, setHover] = useState(null)
  const [selId, setSelId] = useState(null)
  const [q, setQ] = useState('')
  const [ayuda, setAyuda] = useState(() => !sessionStorage.getItem('aeternum-ayuda'))
  const seleccion = slots.find((s) => s.producto.id === selId) || null

  const destacado = useMemo(
    () => [...productos].filter((p) => p.tipo === 'calzado' && p.stock > 0).sort((a, b) => b.precio - a.precio)[0],
    [productos],
  )

  useEffect(() => {
    const escribiendo = (e) => e.target.closest?.('input, textarea, select')
    const abajo = (e) => {
      if (e.code === 'Escape') { setSelId(null); setAyuda(false); return }
      if (escribiendo(e)) return
      if (MOVER.includes(e.code)) { e.preventDefault(); teclas.current.add(e.code); setAyuda(false) }
    }
    const arriba = (e) => teclas.current.delete(e.code)
    const limpiar = () => teclas.current.clear()
    addEventListener('keydown', abajo)
    addEventListener('keyup', arriba)
    addEventListener('blur', limpiar)
    return () => {
      removeEventListener('keydown', abajo)
      removeEventListener('keyup', arriba)
      removeEventListener('blur', limpiar)
      document.body.style.cursor = ''
    }
  }, [])

  useEffect(() => { if (!ayuda) sessionStorage.setItem('aeternum-ayuda', '1') }, [ayuda])

  /** Camina solo hasta quedar frente al producto y lo marca. */
  const irA = useCallback((slot) => {
    const [x, z] = slot.vista
    const dx = slot.pos[0] - x, dz = slot.pos[2] - z
    control.objetivo = {
      x, z,
      yaw: Math.atan2(-dx, -dz),
      pitch: Math.atan2(slot.mirarY - OJOS, Math.hypot(dx, dz)),
    }
    setSelId(slot.producto.id)
    setAyuda(false)
  }, [])

  const irPunto = useCallback((x, z) => {
    x = Math.min(LIMITES.x1, Math.max(LIMITES.x0, x))
    z = Math.min(LIMITES.z1, Math.max(LIMITES.z0, z))
    if (!libre(x, z, cajas)) return
    const yaw = Math.atan2(-(x - control.x), -(z - control.z))
    control.objetivo = { x, z, yaw, pitch: -0.05 }
  }, [cajas])

  const resultados = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return []
    return slots.filter(({ producto: p }) => `${p.nombre} ${p.marca} ${p.categoria}`.toLowerCase().includes(t)).slice(0, 6)
  }, [q, slots])

  const elegir = useCallback((slot) => { setSelId(slot.producto.id); setAyuda(false) }, [])

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden select-none">
      <Canvas dpr={[1, 1.75]} camera={{ fov: 62, near: 0.05, far: 80, position: [INICIO.x, OJOS, INICIO.z] }}>
        <color attach="background" args={[c.fondo]} />
        {/* El primer <Html> que monta drei (v10 + React 19) queda vacío: este absorbe el fallo */}
        <Html><span /></Html>
        <hemisphereLight intensity={c.claro ? 1.15 : 1.05} color="#ffffff" groundColor={c.suelo} />
        <directionalLight position={[3, 8, 4]} intensity={c.claro ? 0.9 : 0.7} />
        {[[-4.5, -5.5], [4.5, -5.5], [-4.5, 3], [4.5, 3], [0, -1.5]].map(([x, z]) => (
          <pointLight key={`${x}${z}`} position={[x, 3.3, z]} intensity={c.claro ? 5 : 13} distance={11} decay={1.5} color="#fff6e8" />
        ))}
        <Sala
          c={c}
          destacado={destacado && (
            <group position={[0, 0.42, 0]} onClick={(e) => { e.stopPropagation(); if (e.delta < 8) setSelId(destacado.id) }}>
              <Girando><Modelo3D producto={destacado} escala={0.55} position={[0, 0, 0]} /></Girando>
            </group>
          )}
        />
        <Exhibidores secciones={secciones} slots={slots} c={c} hover={hover} seleccion={seleccion} onHover={setHover} onElegir={elegir} />
        <Jugador teclas={teclas} control={control} estado={control} cajas={cajas} />
      </Canvas>

      {/* ---------- Interfaz ---------- */}
      <div className="pointer-events-none absolute inset-0 p-3 sm:p-5">
        {/* Buscador */}
        <div className="pointer-events-auto absolute left-3 top-3 w-[min(18rem,calc(100vw-1.5rem))] sm:left-5 sm:top-5">
          <div className="bg-panel/90 border-borde rounded-2xl border p-3 shadow-xl backdrop-blur">
            <div className="text-acento mb-1.5 font-mono text-[10px] uppercase tracking-widest">Tienda 3D · {productos.length} productos</div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Qué buscas? (ej. hoodie, Nike, botas)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && resultados[0]) { irA(resultados[0]); setQ(''); e.currentTarget.blur() }
                if (e.key === 'Escape') { setQ(''); e.currentTarget.blur() }
              }} />
            {resultados.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {resultados.map((s) => (
                  <li key={s.producto.id}>
                    <button onClick={(e) => { irA(s); setQ(''); e.currentTarget.blur() }} className="hover:bg-panel-2 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm">
                      <span className="flex-1 truncate">{s.producto.nombre}</span>
                      <span className="text-tenue font-mono text-[11px]">{s.producto.categoria}</span>
                      <span className="text-acento text-xs">ir →</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {q && resultados.length === 0 && <p className="text-tenue mt-2 text-xs">No hay nada con “{q}”.</p>}
            {cargando && <p className="text-tenue pulso mt-2 font-mono text-xs">cargando inventario…</p>}
            {error && <p className="text-peligro mt-2 font-mono text-xs">{error}</p>}
          </div>
        </div>

        {/* Ficha del producto */}
        {seleccion && (
          <div className="absolute right-3 top-3 sm:right-5 sm:top-5">
            <Detalle producto={seleccion.producto} onCerrar={() => setSelId(null)} onVender={onVender} vendiendo={vendiendo} />
          </div>
        )}

        {/* Minimapa */}
        <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5">
          <Minimapa secciones={secciones} estado={control} seleccion={seleccion} onIr={irPunto} />
        </div>

        {/* Cruceta táctil */}
        <div className="pointer-events-auto absolute bottom-20 right-3 hidden grid-cols-3 gap-1.5 [@media(pointer:coarse)]:grid">
          <span /><Boton codigo="ArrowUp" teclas={teclas}>↑</Boton><span />
          <Boton codigo="ArrowLeft" teclas={teclas}>↺</Boton><Boton codigo="ArrowDown" teclas={teclas}>↓</Boton><Boton codigo="ArrowRight" teclas={teclas}>↻</Boton>
        </div>

        {/* Ayuda de controles */}
        <div className="text-tenue absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs lg:flex">
          <Tecla>W A S D</Tecla>/<Tecla>↑ ↓ ← →</Tecla> caminar · <Tecla>Shift</Tecla> correr · arrastra para mirar · clic en un producto
        </div>

        <button onClick={() => ir('/panel')}
          className="bg-acento text-acento-texto font-display pointer-events-auto absolute bottom-3 right-3 flex cursor-pointer items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition hover:scale-[1.03] active:scale-[.98] sm:bottom-5 sm:right-5 sm:text-base">
          Panel de ventas
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>

        {/* Bienvenida */}
        {ayuda && (
          <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-[2px]">
            <div className="entra bg-panel border-borde w-[min(26rem,calc(100vw-2rem))] rounded-2xl border p-6 shadow-2xl">
              <p className="text-acento font-mono text-xs uppercase tracking-widest">Bienvenido a</p>
              <h1 className="font-display text-4xl font-bold tracking-tight">aeternum<span className="text-acento">.</span></h1>
              <p className="text-tenue mt-2 text-sm">Una tienda de tenis y ropa de segunda mano que puedes recorrer. Todo lo que ves viene de la base de datos en vivo.</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2"><Tecla>W A S D</Tecla> o <Tecla>↑ ↓</Tecla> para caminar, <Tecla>← →</Tecla> para girar</li>
                <li className="flex items-center gap-2"><Tecla>Shift</Tecla> para correr · arrastra el mouse para mirar</li>
                <li>Clic en un producto para ver su ficha y venderlo</li>
                <li>Usa el buscador o el plano de abajo para ir directo a algo</li>
              </ul>
              {destacado && <p className="text-tenue mt-4 text-xs">Hoy en el podio: <span className="text-texto">{destacado.nombre}</span> a {bs(destacado.precio)}</p>}
              <button onClick={() => setAyuda(false)} className="bg-acento text-acento-texto font-display mt-5 w-full cursor-pointer rounded-xl py-3 font-semibold transition hover:brightness-110">
                Entrar a la tienda
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
