// Colores por marca: [capellada, suela, franja]
const MARCAS = {
  nike: ['#f2f2ee', '#ffffff', '#afff00'],
  adidas: ['#141416', '#e9e1cf', '#f2f2ee'],
  vans: ['#18181b', '#f2f2ee', '#f2f2ee'],
  converse: ['#ece4d0', '#f7f3ea', '#1b1b1f'],
  jordan: ['#c8102e', '#f2f2ee', '#111111'],
  asics: ['#2f5fd0', '#f2f2ee', '#f2f2ee'],
  timberland: ['#c98a3c', '#3a2a1c', '#7a5326'],
  'dr. martens': ['#5a1620', '#2a1a14', '#e8c547'],
}

export function coloresDe(producto) {
  const m = MARCAS[(producto?.marca || '').toLowerCase()]
  if (m) return m
  let h = 0
  for (const c of producto?.nombre || 'x') h = (h * 31 + c.charCodeAt(0)) % 360
  return [`hsl(${h} 55% 55%)`, '#f2f2ee', '#0a0a0b']
}

/** Altura del cuello: bota, caña media (Hi/Mid) o baja. */
export function alturaCuello(p) {
  if (p?.categoria === 'Botas') return 0.6
  if (/\b(hi|high|mid)\b/i.test(p?.nombre || '')) return 0.48
  return 0.34
}
