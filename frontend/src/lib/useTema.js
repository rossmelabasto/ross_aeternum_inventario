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
    ? {
        claro: true, fondo: '#ecece6', piso: '#e6e6e0', linea: '#cfcfc8', acento: '#5b3dff', texto: '#141416',
        suelo: '#e4dfd6', junta: '#d3cdc2', techo: '#fafaf7', luz: '#ffffff', pared: '#f4f2ed', zocalo: '#d6d0c5',
        panel: '#e9e5dd', madera: '#b48a5f', encimera: '#2b2b30', metal: '#8f8f96', vidrio: '#cfe3ff', calle: '#dfe9f2',
        vereda: '#c9c4bb', tapete: '#3a3a40', cortina: '#bfb5a6', espejo: '#dfe5ea', planta: '#3f8a4c', maceta: '#d8d2c8',
        alfombra: '#e3ddf7', puf: '#5b3dff', pufTapa: '#6c52ff', bolsa: '#5b3dff', mueble: '#d6d6cf',
      }
    : {
        claro: false, fondo: '#0a0a0b', piso: '#0f0f11', linea: '#26262b', acento: '#afff00', texto: '#ededed',
        suelo: '#1f1f23', junta: '#2a2a30', techo: '#141417', luz: '#f2f2ea', pared: '#27272c', zocalo: '#141416',
        panel: '#2e2e34', madera: '#5a4330', encimera: '#0d0d0f', metal: '#7a7a82', vidrio: '#3a5068', calle: '#2a3440',
        vereda: '#26262b', tapete: '#0d0d0f', cortina: '#34343c', espejo: '#5f6670', planta: '#2f6b3a', maceta: '#2c2c31',
        alfombra: '#141417', puf: '#34343b', pufTapa: '#3f3f47', bolsa: '#afff00', mueble: '#232328',
      }
