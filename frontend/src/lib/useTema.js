import { useEffect, useState } from 'react'

export function useTema() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema || 'oscuro')
  useEffect(() => {
    document.documentElement.dataset.tema = tema
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', tema === 'claro' ? '#f4f4f0' : '#0a0a0b')
    try { localStorage.setItem('aeternum-tema', tema) } catch { /* modo privado */ }
  }, [tema])
  return [tema, () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'))]
}

/** Colores de la escena 3D según el tema */
export const colores3D = (tema) =>
  tema === 'claro'
    ? { claro: true, fondo: '#ecece6', piso: '#e6e6e0', pared: '#efefea', mueble: '#d6d6cf', acento: '#5b3dff', linea: '#cfcfc8' }
    : { claro: false, fondo: '#0a0a0b', piso: '#0f0f11', pared: '#131316', mueble: '#232328', acento: '#afff00', linea: '#26262b' }
