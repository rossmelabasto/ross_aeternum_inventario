// Colores por marca para el calzado: [capellada, suela, franja]
const MARCAS = {
  nike: ['#f2f2ee', '#ffffff', '#afff00'],
  adidas: ['#141416', '#e9e1cf', '#f2f2ee'],
  vans: ['#18181b', '#f2f2ee', '#f2f2ee'],
  converse: ['#ece4d0', '#f7f3ea', '#1b1b1f'],
  jordan: ['#c8102e', '#f2f2ee', '#111111'],
  asics: ['#2f5fd0', '#f2f2ee', '#f2f2ee'],
  timberland: ['#c98a3c', '#3a2a1c', '#7a5326'],
  'dr. martens': ['#5a1620', '#2a1a14', '#e8c547'],
  'new balance': ['#8a8f98', '#f2f2ee', '#1b1b1f'],
  reebok: ['#f2efe6', '#e9e1cf', '#1f6b46'],
  puma: ['#ff6a3d', '#f2f2ee', '#141416'],
  caterpillar: ['#6b4a2b', '#2a1a14', '#e8c547'],
}

export const TIPOS = ['calzado', 'polera', 'hoodie', 'chamarra', 'pantalon', 'gorra']

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const luz = (h) => { const [r, g, b] = hex(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b }

/** Aclara (f > 0) u oscurece (f < 0) un color hexadecimal. */
export function matiz(h, f) {
  const c = hex(h).map((v) => Math.round(255 * Math.min(1, Math.max(0, f > 0 ? v + (1 - v) * f : v * (1 + f)))))
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** [principal, secundario, detalle] de un producto. */
export function coloresDe(p) {
  const tipo = p?.tipo || 'calzado'
  if (tipo === 'calzado') {
    const m = MARCAS[(p?.marca || '').toLowerCase()]
    if (p?.color) return [p.color, m?.[1] || '#f2f2ee', luz(p.color) > 0.6 ? '#1b1b1f' : '#f2f2ee']
    if (m) return m
  }
  if (p?.color) {
    const c = p.color
    return [c, matiz(c, luz(c) > 0.5 ? -0.25 : 0.2), luz(c) > 0.55 ? '#141416' : '#f2f2ee']
  }
  let h = 0
  for (const ch of p?.nombre || 'x') h = (h * 31 + ch.charCodeAt(0)) % 360
  return [`hsl(${h} 55% 55%)`, '#f2f2ee', '#0a0a0b']
}

/** Altura del cuello del calzado: bota, caña media (Hi/Mid) o baja. */
export function alturaCuello(p) {
  if (p?.categoria === 'Botas') return 0.6
  if (/\b(hi|high|mid)\b/i.test(p?.nombre || '')) return 0.48
  return 0.34
}
