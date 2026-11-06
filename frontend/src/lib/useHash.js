import { useEffect, useState } from 'react'

/** Enrutador mínimo por hash: #/ · #/panel · #/visor/3 */
export function useHash() {
  const leer = () => (location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean)
  const [partes, setPartes] = useState(leer)
  useEffect(() => {
    const f = () => { setPartes(leer()); window.scrollTo(0, 0) }
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return partes
}

export const ir = (ruta) => { location.hash = ruta }
