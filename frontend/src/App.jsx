import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import Panel from './components/Panel.jsx'
import { api } from './lib/api.js'
import { ir, useHash } from './lib/useHash.js'
import { useTema } from './lib/useTema.js'

// Las vistas 3D se cargan aparte para que el panel abra rápido
const Tienda3D = lazy(() => import('./components/tienda/Tienda3D.jsx'))
const Visor3D = lazy(() => import('./components/Visor3D.jsx'))

function Logo() {
  return (
    <button onClick={() => ir('/')} className="flex cursor-pointer items-center gap-2.5" aria-label="Inicio">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="14" className="fill-panel-2" />
        <path d="M10 42c0-4 3-6 6-6l8-1 6-9c2-3 5-3 7-1l4 5 9 3c4 1 6 4 6 8v2H10z" className="fill-acento" />
        <rect x="10" y="44" width="46" height="6" rx="3" className="fill-texto" />
      </svg>
      <span className="font-display hidden text-lg font-bold tracking-tight sm:inline">aeternum<span className="text-acento">.</span></span>
    </button>
  )
}

function Nav({ vista, tema, cambiarTema }) {
  const enlaces = [['/', 'Tienda 3D', 'tienda'], ['/panel', 'Panel', 'panel'], ['/visor', 'Visor 3D', 'visor']]
  return (
    <header className="bg-fondo/80 border-borde sticky top-0 z-30 h-16 border-b backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="ml-auto flex items-center gap-0.5 text-sm sm:gap-1">
          {enlaces.map(([ruta, texto, clave]) => (
            <a key={clave} href={`#${ruta}`}
              className={`whitespace-nowrap rounded-full px-2.5 py-1.5 transition sm:px-3 ${vista === clave ? 'bg-panel-2 text-acento' : 'text-tenue hover:text-texto'}`}>
              {texto}
            </a>
          ))}
          <a href="/diapos/" className="text-tenue hover:text-texto whitespace-nowrap rounded-full px-2.5 py-1.5 transition sm:px-3">Diapositivas</a>
        </nav>
        <button onClick={cambiarTema} title="Cambiar tema" aria-label="Cambiar tema"
          className="border-borde hover:border-acento grid h-9 w-9 cursor-pointer place-items-center rounded-full border transition">
          {tema === 'oscuro' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
          )}
        </button>
      </div>
    </header>
  )
}

function Avisos({ avisos }) {
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {avisos.map((a) => (
        <div key={a.id} className={`entra rounded-full border px-4 py-2 text-sm shadow-lg backdrop-blur ${a.error ? 'border-peligro/40 bg-peligro/15 text-peligro' : 'border-borde bg-panel/95'}`}>
          {!a.error && <span className="text-acento mr-1.5">●</span>}{a.texto}
        </div>
      ))}
    </div>
  )
}

const Cargando = () => (
  <div className="text-tenue pulso grid h-[60dvh] place-items-center font-mono text-sm">cargando escena 3D…</div>
)

export default function App() {
  const [ruta, id] = useHash()
  const vista = ruta === 'panel' ? 'panel' : ruta === 'visor' ? 'visor' : 'tienda'
  const [tema, cambiarTema] = useTema()

  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [resumen, setResumen] = useState(null)
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [vendiendo, setVendiendo] = useState(null)
  const [avisos, setAvisos] = useState([])
  const n = useRef(0)

  const avisar = useCallback((texto, err = false) => {
    const a = { id: ++n.current, texto, error: err }
    setAvisos((xs) => [...xs.slice(-2), a])
    setTimeout(() => setAvisos((xs) => xs.filter((x) => x.id !== a.id)), 3200)
  }, [])

  const recargar = useCallback(async () => {
    try {
      const [r, v] = await Promise.all([api.resumen(), api.ventas(8)])
      setResumen(r)
      setVentas(v)
    } catch { /* el panel sigue con lo último que tenía */ }
  }, [])

  useEffect(() => {
    Promise.all([api.categorias(), api.productos()])
      .then(([c, p]) => { setCategorias(c); setProductos(p); setError('') })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
    recargar()
  }, [recargar])

  /** Venta optimista: baja el stock en pantalla al instante y lo confirma con el backend. */
  const vender = useCallback(async (p) => {
    setVendiendo(p.id)
    setProductos((ps) => ps.map((x) => (x.id === p.id ? { ...x, stock: x.stock - 1 } : x)))
    try {
      const r = await api.vender(p.id)
      setProductos((ps) => ps.map((x) => (x.id === p.id ? { ...x, stock: r.stock_restante } : x)))
      avisar(`Vendido: ${p.nombre} · quedan ${r.stock_restante}`)
      recargar()
    } catch (e) {
      // Se revierte con el stock real del servidor
      api.producto(p.id).then((real) => setProductos((ps) => ps.map((x) => (x.id === p.id ? real : x)))).catch(() => {})
      avisar(e.message, true)
    } finally {
      setVendiendo(null)
    }
  }, [avisar, recargar])

  return (
    <>
      <Nav vista={vista} tema={tema} cambiarTema={cambiarTema} />
      <main>
        {vista === 'panel' && (
          <Panel categorias={categorias} productos={productos} setProductos={setProductos} resumen={resumen}
            ventas={ventas} recargar={recargar} onVender={vender} vendiendo={vendiendo} avisar={avisar} />
        )}
        <Suspense fallback={<Cargando />}>
          {vista === 'tienda' && <Tienda3D categorias={categorias} productos={productos} tema={tema} cargando={cargando} error={error} onVender={vender} vendiendo={vendiendo !== null} />}
          {vista === 'visor' && <Visor3D productos={productos} id={id} tema={tema} onVender={vender} vendiendo={vendiendo !== null} />}
        </Suspense>
      </main>
      {vista !== 'tienda' && (
        <footer className="text-tenue mx-auto max-w-7xl px-6 py-8 text-xs">
          Aeternum · proyecto de Tecnologías Informáticas (UDABOL) · datos ficticios · React + Three.js + FastAPI + Supabase · <a href="/diapos/" className="hover:text-acento underline">diapositivas</a> · <a href="/diapos/aeternum-diapositivas.pdf" download className="hover:text-acento underline">descargar PDF</a>
        </footer>
      )}
      <Avisos avisos={avisos} />
    </>
  )
}
