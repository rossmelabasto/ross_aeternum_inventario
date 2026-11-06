import { bs } from '../../lib/api.js'
import { coloresDe } from '../../lib/colores.js'
import { ir } from '../../lib/useHash.js'

/** Ficha del producto elegido en la tienda. */
export function Detalle({ producto: p, onCerrar, onVender, vendiendo }) {
  if (!p) return null
  return (
    <div className="entra bg-panel/95 border-borde pointer-events-auto w-[min(20rem,calc(100vw-2rem))] rounded-2xl border p-5 shadow-2xl backdrop-blur" key={p.id}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-tenue font-mono text-xs uppercase">{p.categoria} · {p.marca}</div>
        <button onClick={onCerrar} aria-label="Cerrar" className="text-tenue hover:text-texto -mr-1 -mt-1 cursor-pointer px-1 text-lg leading-none">×</button>
      </div>
      <h2 className="font-display mt-1 text-2xl font-bold leading-tight tracking-tight">{p.nombre}</h2>
      <div className="mt-3 flex gap-1.5">
        {coloresDe(p).map((col, i) => <span key={i} className="border-borde h-4 w-4 rounded-full border" style={{ background: col }} />)}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-tenue text-xs">Talla</dt><dd className="font-mono">{p.talla}</dd></div>
        <div><dt className="text-tenue text-xs">Stock</dt><dd className={`font-mono ${p.stock ? '' : 'text-peligro'}`}>{p.stock || 'agotado'}</dd></div>
        <div className="col-span-2"><dt className="text-tenue text-xs">Condición</dt><dd>{p.condicion}</dd></div>
      </dl>
      <div className="text-acento font-display mt-3 text-3xl font-bold">{bs(p.precio)}</div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          disabled={!p.stock || vendiendo}
          onClick={() => onVender(p)}
          className="bg-acento text-acento-texto font-display cursor-pointer rounded-xl py-2.5 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {p.stock ? 'Vender 1 unidad' : 'Sin stock'}
        </button>
        <button onClick={() => ir(`/visor/${p.id}`)} className="border-borde hover:border-acento cursor-pointer rounded-xl border py-2.5 text-sm transition">
          Ver en 3D
        </button>
      </div>
    </div>
  )
}
