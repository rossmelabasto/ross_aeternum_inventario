import { useEffect, useMemo, useState } from 'react'
import { API_URL, api, bs, escucharRegistro } from '../lib/api.js'
import { ir } from '../lib/useHash.js'
import { coloresDe } from '../lib/colores.js'

const VACIO = { nombre: '', marca: '', categoria_id: '', talla: '', precio: '', stock: '1', condicion: 'Usado - buen estado' }

function Tarjeta({ titulo, valor, extra }) {
  return (
    <div className="bg-panel border-borde rounded-2xl border p-4">
      <div className="text-tenue font-mono text-[11px] uppercase tracking-wider">{titulo}</div>
      <div className="font-display mt-1 text-2xl font-bold tracking-tight">{valor}</div>
      {extra && <div className="text-tenue text-xs">{extra}</div>}
    </div>
  )
}

function Formulario({ categorias, onCreado, avisar }) {
  const [f, setF] = useState(VACIO)
  const [enviando, setEnviando] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  useEffect(() => {
    if (!f.categoria_id && categorias[0]) setF((x) => ({ ...x, categoria_id: String(categorias[0].id) }))
  }, [categorias, f.categoria_id])

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    try {
      const nuevo = await api.crearProducto({
        ...f,
        categoria_id: Number(f.categoria_id),
        talla: Number(f.talla),
        precio: Number(f.precio),
        stock: Number(f.stock),
      })
      onCreado(nuevo)
      avisar(`Registrado: ${nuevo.nombre}`)
      setF({ ...VACIO, categoria_id: f.categoria_id })
    } catch (err) {
      avisar(err.message, true)
    } finally {
      setEnviando(false)
    }
  }

  const etiqueta = 'text-tenue mb-1 block text-xs'
  return (
    <form onSubmit={enviar} className="bg-panel border-borde rounded-2xl border p-5">
      <h2 className="font-display text-lg font-semibold">Registrar producto</h2>
      <p className="text-tenue mb-4 text-sm">Se guarda en Supabase con un POST a la API.</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2"><span className={etiqueta}>Nombre</span>
          <input required minLength={2} value={f.nombre} onChange={set('nombre')} placeholder="Air Max 90" /></label>
        <label><span className={etiqueta}>Marca</span>
          <input required minLength={2} value={f.marca} onChange={set('marca')} placeholder="Nike" /></label>
        <label><span className={etiqueta}>Categoría</span>
          <select value={f.categoria_id} onChange={set('categoria_id')}>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select></label>
        <label><span className={etiqueta}>Talla</span>
          <input required type="number" min="30" max="50" step="0.5" value={f.talla} onChange={set('talla')} placeholder="41" /></label>
        <label><span className={etiqueta}>Precio (Bs)</span>
          <input required type="number" min="1" step="0.01" value={f.precio} onChange={set('precio')} placeholder="400" /></label>
        <label><span className={etiqueta}>Stock</span>
          <input required type="number" min="0" step="1" value={f.stock} onChange={set('stock')} /></label>
        <label><span className={etiqueta}>Condición</span>
          <select value={f.condicion} onChange={set('condicion')}>
            <option>Nuevo</option><option>Usado - como nuevo</option><option>Usado - buen estado</option>
          </select></label>
      </div>
      <button
        disabled={enviando}
        className="bg-acento text-acento-texto font-display mt-4 w-full cursor-pointer rounded-xl py-2.5 font-semibold transition hover:brightness-110 disabled:opacity-50"
      >
        {enviando ? 'Guardando…' : 'Registrar'}
      </button>
    </form>
  )
}

function ApiLog() {
  const [lineas, setLineas] = useState([])
  useEffect(() => escucharRegistro(setLineas), [])
  const color = (s) => (s >= 200 && s < 300 ? 'text-acento' : s >= 400 && s < 500 ? 'text-amber-400' : 'text-peligro')
  return (
    <div className="border-borde overflow-hidden rounded-2xl border bg-black/80 font-mono text-xs text-neutral-300">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-neutral-500">api.log</span>
        <a href={API_URL.replace(/\/api\/v1$/, '/docs')} target="_blank" rel="noreferrer" className="ml-auto text-neutral-500 hover:text-white">swagger ↗</a>
      </div>
      <div className="h-44 overflow-y-auto px-4 py-2 leading-relaxed">
        {lineas.length === 0 && <div className="text-neutral-600">esperando peticiones…</div>}
        {lineas.map((l, i) => (
          <div key={i} className={i === 0 ? 'entra' : ''}>
            <span className="text-neutral-600">{l.hora.toLocaleTimeString('es-BO', { hour12: false })}</span>{' '}
            <span className="text-white">{l.metodo.padEnd(5)}</span> <span>{l.ruta}</span>{' '}
            <span className={color(l.estado)}>{l.estado || 'ERR'}</span> <span className="text-neutral-600">{l.ms} ms</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Panel({ categorias, productos, setProductos, resumen, ventas, recargar, onVender, vendiendo, avisar }) {
  const [filtro, setFiltro] = useState(0)
  const [buscar, setBuscar] = useState('')

  const lista = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    return productos.filter(
      (p) => (!filtro || p.categoria_id === filtro) && (!q || `${p.nombre} ${p.marca}`.toLowerCase().includes(q)),
    )
  }, [productos, filtro, buscar])

  async function reponer(p) {
    const antes = p.stock
    setProductos((ps) => ps.map((x) => (x.id === p.id ? { ...x, stock: x.stock + 1 } : x)))
    try {
      await api.cambiarStock(p.id, antes + 1)
      recargar()
    } catch (e) {
      setProductos((ps) => ps.map((x) => (x.id === p.id ? { ...x, stock: antes } : x)))
      avisar(e.message, true)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="entra mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-acento font-mono text-xs uppercase tracking-widest">Panel de control</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Ventas e inventario</h1>
        </div>
        <button onClick={() => ir('/')} className="border-borde hover:border-acento cursor-pointer rounded-full border px-4 py-2 text-sm transition">
          ← Volver a la tienda 3D
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tarjeta titulo="Productos" valor={resumen?.productos ?? '—'} />
        <Tarjeta titulo="Pares en stock" valor={resumen?.unidades_en_stock ?? '—'} />
        <Tarjeta titulo="Valor inventario" valor={resumen ? bs(resumen.valor_inventario) : '—'} />
        <Tarjeta titulo="Ventas" valor={resumen?.ventas ?? '—'} />
        <Tarjeta titulo="Ingresos" valor={resumen ? bs(resumen.ingresos) : '—'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="bg-panel border-borde overflow-hidden rounded-2xl border">
          <div className="border-borde flex flex-wrap items-center gap-2 border-b p-4">
            {[{ id: 0, nombre: 'Todas' }, ...categorias].map((c) => (
              <button
                key={c.id}
                onClick={() => setFiltro(c.id)}
                className={`cursor-pointer rounded-full px-3 py-1 text-sm transition ${filtro === c.id ? 'bg-acento text-acento-texto font-semibold' : 'bg-panel-2 hover:text-acento'}`}
              >
                {c.nombre}
              </button>
            ))}
            <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar…" className="ml-auto !w-40" />
          </div>
          <div className="divide-borde divide-y">
            {lista.length === 0 && <p className="text-tenue p-6 text-center">Sin resultados.</p>}
            {lista.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                <button onClick={() => ir(`/visor/${p.id}`)} title="Ver en 3D"
                  className="border-borde hover:border-acento grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl border transition"
                  style={{ background: `linear-gradient(135deg, ${coloresDe(p)[0]}, ${coloresDe(p)[1]})` }}>
                  <span className="sr-only">Ver en 3D</span>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.nombre}</div>
                  <div className="text-tenue text-xs">{p.marca} · {p.categoria} · talla {Number(p.talla)} · {p.condicion}</div>
                </div>
                <div className="font-mono text-sm">{bs(p.precio)}</div>
                <div className="flex items-center gap-1">
                  <span className={`min-w-16 rounded-full px-2.5 py-1 text-center font-mono text-xs ${p.stock === 0 ? 'bg-peligro/15 text-peligro' : p.stock === 1 ? 'bg-amber-400/15 text-amber-500' : 'bg-panel-2'}`}>
                    {p.stock === 0 ? 'agotado' : `stock ${p.stock}`}
                  </span>
                  <button onClick={() => reponer(p)} title="Reponer 1 (PATCH stock)"
                    className="text-tenue hover:text-acento cursor-pointer px-1.5 font-mono text-lg leading-none">+</button>
                </div>
                <button
                  disabled={p.stock === 0 || vendiendo === p.id}
                  onClick={() => onVender(p)}
                  className="bg-acento text-acento-texto font-display w-full cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 sm:w-auto"
                >
                  Vender 1 unidad
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <Formulario categorias={categorias} avisar={avisar} onCreado={(n) => { setProductos((ps) => [...ps, n]); recargar() }} />
          <div className="bg-panel border-borde rounded-2xl border p-5">
            <h2 className="font-display mb-3 text-lg font-semibold">Últimas ventas</h2>
            {ventas.length === 0 && <p className="text-tenue text-sm">Aún no hay ventas.</p>}
            <ul className="space-y-2 text-sm">
              {ventas.map((v) => (
                <li key={v.id} className="flex items-center gap-2">
                  <span className="text-tenue w-12 font-mono text-xs">#{v.id}</span>
                  <span className="flex-1 truncate">{v.producto}</span>
                  <span className="text-tenue text-xs">{v.canal}</span>
                  <span className="font-mono">{bs(v.total)}</span>
                </li>
              ))}
            </ul>
          </div>
          <ApiLog />
        </div>
      </div>
    </div>
  )
}
