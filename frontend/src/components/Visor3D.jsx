import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, OrbitControls } from '@react-three/drei'
import { Modelo3D } from './modelos/Modelo3D.jsx'
import { coloresDe } from '../lib/colores.js'
import { bs } from '../lib/api.js'
import { ir } from '../lib/useHash.js'
import { colores3D } from '../lib/useTema.js'

/** Visor independiente: un par grande que se gira y acerca con el mouse (OrbitControls). */
export default function Visor3D({ productos, id, tema, onVender, vendiendo }) {
  const c = colores3D(tema)
  const [girar, setGirar] = useState(true)
  const producto = productos.find((p) => p.id === Number(id)) || productos[0]

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[1fr_340px] sm:px-6">
      <div className="bg-panel border-borde relative h-[62dvh] min-h-[380px] overflow-hidden rounded-2xl border">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [1.6, 1.1, 1.9], fov: 40 }}>
          <color attach="background" args={[tema === 'claro' ? '#ffffff' : '#121214']} />
          <hemisphereLight intensity={tema === 'claro' ? 1.2 : 0.7} groundColor={c.piso} />
          <directionalLight position={[3, 5, 2]} intensity={1.6} castShadow />
          <directionalLight position={[-3, 2, -2]} intensity={0.5} />
          <pointLight position={[0, 0.3, 1.5]} intensity={2} color={c.acento} distance={4} />
          {producto && (
            <Bounds key={producto.id} fit clip observe margin={1.25}>
              {/* Center deja el centro del modelo en el origen: los controles giran siempre alrededor de él */}
              <Center>
                <Modelo3D producto={producto} escala={producto.tipo === 'calzado' ? 1.3 : 2.2} />
              </Center>
            </Bounds>
          )}
          
          <OrbitControls makeDefault
            autoRotate={girar}
            autoRotateSpeed={1.6}
            enablePan={false}
            minDistance={0.6}
            maxDistance={6}
                        enableDamping
          />
        </Canvas>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="text-tenue font-mono text-xs">visor_3d · arrastra para girar · rueda para zoom</span>
          <button
            onClick={() => setGirar((g) => !g)}
            className="bg-panel-2 border-borde hover:border-acento pointer-events-auto cursor-pointer rounded-full border px-3 py-1 font-mono text-xs transition"
          >
            {girar ? '⏸ pausar giro' : '▶ girar solo'}
          </button>
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        {producto ? (
          <div className="bg-panel border-borde entra rounded-2xl border p-5" key={producto.id}>
            <div className="text-tenue font-mono text-xs uppercase">{producto.categoria} · {producto.marca}</div>
            <h2 className="font-display mt-1 text-3xl font-bold leading-tight tracking-tight">{producto.nombre}</h2>
            <div className="mt-3 flex gap-1.5">
              {coloresDe(producto).map((col, i) => (
                <span key={i} className="border-borde h-5 w-5 rounded-full border" style={{ background: col }} />
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-tenue">Talla</dt><dd className="font-mono text-lg">{producto.talla}</dd></div>
              <div><dt className="text-tenue">Stock</dt><dd className={`font-mono text-lg ${producto.stock ? '' : 'text-peligro'}`}>{producto.stock || 'agotado'}</dd></div>
              <div className="col-span-2"><dt className="text-tenue">Condición</dt><dd>{producto.condicion}</dd></div>
            </dl>
            <div className="text-acento font-display mt-4 text-3xl font-bold">{bs(producto.precio)}</div>
            <button
              disabled={!producto.stock || vendiendo}
              onClick={() => onVender(producto)}
              className="bg-acento text-acento-texto font-display mt-4 w-full cursor-pointer rounded-xl py-3 font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {producto.stock ? 'Vender 1 unidad' : 'Sin stock'}
            </button>
          </div>
        ) : (
          <div className="bg-panel border-borde text-tenue rounded-2xl border p-5">Todavía no hay productos.</div>
        )}

        <div className="bg-panel border-borde rounded-2xl border p-3">
          <div className="text-tenue px-2 pb-2 font-mono text-xs uppercase">Otros productos</div>
          <div className="max-h-64 overflow-y-auto">
            {productos.map((p) => (
              <button
                key={p.id}
                onClick={() => ir(`/visor/${p.id}`)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition ${p.id === producto?.id ? 'bg-panel-2 text-acento' : 'hover:bg-panel-2'}`}
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: coloresDe(p)[0] }} />
                <span className="flex-1 truncate">{p.nombre}</span>
                <span className="text-tenue font-mono text-xs">{p.categoria}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
