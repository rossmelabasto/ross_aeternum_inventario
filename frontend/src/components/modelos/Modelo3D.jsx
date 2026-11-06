import { Sneaker } from './Sneaker.jsx'
import { Chamarra, Gorra, Hoodie, Pantalon, Polera } from './Prendas.jsx'

const MODELOS = { polera: Polera, hoodie: Hoodie, chamarra: Chamarra, pantalon: Pantalon, gorra: Gorra }

/** Elige el modelo 3D según el tipo de la categoría del producto. */
export function Modelo3D({ producto, agotado = false, ...props }) {
  const tipo = producto?.tipo || 'calzado'
  if (tipo === 'calzado') return <Sneaker producto={producto} agotado={agotado} {...props} />
  const M = MODELOS[tipo] || Polera
  return (
    <group {...props}>
      <M producto={producto} agotado={agotado} />
    </group>
  )
}

/** ¿El modelo cuelga de un gancho (origen arriba)? */
export const cuelga = (tipo) => ['polera', 'hoodie', 'chamarra', 'pantalon'].includes(tipo)
