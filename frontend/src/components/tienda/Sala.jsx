import { Text } from '@react-three/drei'
import fuente from '@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff?url'
import { CAJA, PLANTAS, PODIO, PROBADORES, PUERTA, PUFS, SALA } from './layout.js'

export { fuente }

const { x0, x1, z0, z1, alto } = SALA
const ANCHO = x1 - x0
const FONDO = z1 - z0

function Caja({ pos, tam, color, ...m }) {
  return (
    <mesh position={pos}>
      <boxGeometry args={tam} />
      <meshStandardMaterial color={color} roughness={0.8} {...m} />
    </mesh>
  )
}

function Planta({ x, z, c }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.24, 0.19, 0.5, 20]} />
        <meshStandardMaterial color={c.maceta} roughness={0.7} />
      </mesh>
      {[[0, 0.95, 0, 0.38], [0.18, 0.75, 0.1, 0.28], [-0.16, 0.8, -0.08, 0.3], [0.05, 1.25, -0.05, 0.26]].map(([px, py, pz, r], i) => (
        <mesh key={i} position={[px, py, pz]}>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={c.planta} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function Paredes({ c }) {
  const lado = (ANCHO / 2 - PUERTA) // largo de cada tramo de la pared frontal
  return (
    <group>
      {/* Piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[ANCHO, FONDO]} />
        <meshStandardMaterial color={c.suelo} roughness={0.75} />
      </mesh>
      {/* Juntas del piso */}
      {Array.from({ length: Math.floor(ANCHO / 2) - 1 }, (_, i) => x0 + 2 + i * 2).map((x) => (
        <mesh key={'x' + x} position={[x, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.015, FONDO]} />
          <meshBasicMaterial color={c.junta} />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(FONDO / 2) - 1 }, (_, i) => z0 + 2 + i * 2).map((z) => (
        <mesh key={'z' + z} position={[0, 0.002, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ANCHO, 0.015]} />
          <meshBasicMaterial color={c.junta} />
        </mesh>
      ))}
      {/* Techo */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, alto, 0]}>
        <planeGeometry args={[ANCHO, FONDO]} />
        <meshStandardMaterial color={c.techo} roughness={1} />
      </mesh>
      {/* Paneles de luz del techo */}
      {[-4.5, 0, 4.5].map((x) =>
        [-6.5, -2, 2.5, 7].map((z) => (
          <mesh key={`${x}${z}`} position={[x, alto - 0.02, z]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.35, 2.6]} />
            <meshBasicMaterial color={c.luz} toneMapped={false} />
          </mesh>
        )),
      )}
      {/* Pared del fondo y laterales */}
      <Caja pos={[0, alto / 2, z0 - 0.05]} tam={[ANCHO, alto, 0.1]} color={c.pared} />
      <Caja pos={[x0 - 0.05, alto / 2, 0]} tam={[0.1, alto, FONDO]} color={c.pared} />
      <Caja pos={[x1 + 0.05, alto / 2, 0]} tam={[0.1, alto, FONDO]} color={c.pared} />
      {/* Zócalo */}
      <Caja pos={[0, 0.06, z0 + 0.01]} tam={[ANCHO, 0.12, 0.02]} color={c.zocalo} />
      <Caja pos={[x0 + 0.01, 0.06, 0]} tam={[0.02, 0.12, FONDO]} color={c.zocalo} />
      <Caja pos={[x1 - 0.01, 0.06, 0]} tam={[0.02, 0.12, FONDO]} color={c.zocalo} />
      {/* Fachada: vidrieras a los lados de la puerta */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (PUERTA + lado / 2), 0, z1]}>
          <Caja pos={[0, 0.3, 0]} tam={[lado, 0.6, 0.12]} color={c.pared} />
          <Caja pos={[0, alto - 0.35, 0]} tam={[lado, 0.7, 0.12]} color={c.pared} />
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[lado, 2.0, 0.04]} />
            <meshStandardMaterial color={c.vidrio} transparent opacity={0.28} roughness={0.05} metalness={0.2} />
          </mesh>
          {[-lado / 2 + 0.03, 0, lado / 2 - 0.03].map((x) => <Caja key={x} pos={[x, 1.6, 0]} tam={[0.06, 2.0, 0.08]} color={c.metal} metalness={0.5} />)}
        </group>
      ))}
      {/* Marco de la puerta y vidrio */}
      <Caja pos={[0, 2.2 + (alto - 2.2) / 2, z1]} tam={[PUERTA * 2, alto - 2.2, 0.12]} color={c.pared} />
      {[-PUERTA, PUERTA].map((x) => <Caja key={x} pos={[x, 1.1, z1]} tam={[0.08, 2.2, 0.14]} color={c.metal} metalness={0.5} />)}
      {/* Exterior: luz de la calle */}
      <mesh position={[0, 1.6, z1 + 3]}>
        <planeGeometry args={[30, 6]} />
        <meshBasicMaterial color={c.calle} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, z1 + 1.5]}>
        <planeGeometry args={[30, 3]} />
        <meshStandardMaterial color={c.vereda} />
      </mesh>
      {/* Tapete de entrada */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, z1 - 0.8]}>
        <planeGeometry args={[2.6, 1.2]} />
        <meshStandardMaterial color={c.tapete} roughness={1} />
      </mesh>
    </group>
  )
}

function Neon({ c }) {
  return (
    <group position={[0, 3.05, z0 + 0.03]}>
      <Text font={fuente} fontSize={0.46} anchorX="center" anchorY="middle" letterSpacing={-0.02}>
        aeternum.
        <meshBasicMaterial color={c.acento} toneMapped={false} />
      </Text>
      <pointLight position={[0, 0, 0.6]} color={c.acento} intensity={c.claro ? 1.5 : 4} distance={5} />
    </group>
  )
}

function Mostrador({ c }) {
  const { x, z, ancho, fondo } = CAJA
  return (
    <group position={[x, 0, z]}>
      <Caja pos={[0, 0.5, 0]} tam={[ancho, 1.0, fondo]} color={c.madera} />
      <Caja pos={[0, 1.02, 0]} tam={[ancho + 0.08, 0.05, fondo + 0.08]} color={c.encimera} roughness={0.3} />
      <mesh position={[0, 0.5, -fondo / 2 - 0.006]}>
        <planeGeometry args={[ancho - 0.3, 0.03]} />
        <meshBasicMaterial color={c.acento} toneMapped={false} />
      </mesh>
      {/* Caja registradora / tablet */}
      <group position={[-0.6, 1.05, 0.05]}>
        <Caja pos={[0, 0.09, 0]} tam={[0.05, 0.18, 0.05]} color={c.metal} />
        <mesh position={[0, 0.25, -0.02]} rotation={[-0.35, Math.PI, 0]}>
          <boxGeometry args={[0.34, 0.24, 0.02]} />
          <meshStandardMaterial color="#0b0b0c" />
        </mesh>
        <mesh position={[0, 0.25, -0.032]} rotation={[-0.35, Math.PI, 0]}>
          <planeGeometry args={[0.3, 0.2]} />
          <meshBasicMaterial color={c.acento} toneMapped={false} transparent opacity={0.85} />
        </mesh>
      </group>
      <Caja pos={[0.7, 1.11, 0.1]} tam={[0.36, 0.12, 0.26]} color={c.bolsa} />
      <Text font={fuente} fontSize={0.13} position={[0.6, 0.62, -fondo / 2 - 0.01]} rotation={[0, Math.PI, 0]} color={c.texto} anchorX="center">
        CAJA
      </Text>
    </group>
  )
}

function Probadores({ c }) {
  const { x0: a, x1: b, z0: d } = PROBADORES
  const ancho = b - a
  return (
    <group>
      <Caja pos={[(a + b) / 2, 1.2, d]} tam={[ancho, 2.4, 0.08]} color={c.panel} />
      <Caja pos={[b, 1.2, (d + z1) / 2]} tam={[0.08, 2.4, z1 - d]} color={c.panel} />
      {/* Cortinas de los dos probadores, mirando al interior de la tienda */}
      {[0, 1].map((i) => {
        const cz = d + 0.9 + i * 1.5
        return (
          <group key={i} position={[b + 0.06, 0, cz]}>
            {Array.from({ length: 7 }, (_, k) => (
              <mesh key={k} position={[Math.sin(k * 1.7) * 0.02, 1.15, -0.6 + k * 0.2]}>
                <boxGeometry args={[0.03, 2.1, 0.2]} />
                <meshStandardMaterial color={c.cortina} roughness={1} />
              </mesh>
            ))}
          </group>
        )
      })}
      <Text font={fuente} fontSize={0.16} position={[b + 0.1, 2.15, d + 1.6]} rotation={[0, Math.PI / 2, 0]} color={c.texto} anchorX="center">
        PROBADORES
      </Text>
      {/* Espejo */}
      <group position={[(a + b) / 2, 0, d - 0.05]} rotation={[0, Math.PI, 0]}>
        <Caja pos={[0, 1.15, 0.02]} tam={[0.8, 1.9, 0.04]} color={c.metal} metalness={0.6} />
        <mesh position={[0, 1.15, 0.045]}>
          <planeGeometry args={[0.7, 1.8]} />
          <meshStandardMaterial color={c.espejo} metalness={0.9} roughness={0.08} />
        </mesh>
      </group>
    </group>
  )
}

function Podio({ c, children }) {
  return (
    <group position={[PODIO.x, 0, PODIO.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color={c.alfombra} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[2.16, 2.2, 64]} />
        <meshBasicMaterial color={c.acento} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[PODIO.r, PODIO.r + 0.08, 0.4, 40]} />
        <meshStandardMaterial color={c.panel} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.405, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PODIO.r - 0.08, PODIO.r - 0.04, 64]} />
        <meshBasicMaterial color={c.acento} toneMapped={false} />
      </mesh>
      {children}
    </group>
  )
}

export function Sala({ c, destacado }) {
  return (
    <>
      <Paredes c={c} />
      <Neon c={c} />
      <Mostrador c={c} />
      <Probadores c={c} />
      <Podio c={c}>{destacado}</Podio>
      {PLANTAS.map(([x, z]) => <Planta key={`${x}${z}`} x={x} z={z} c={c} />)}
      {PUFS.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.44, 28]} />
            <meshStandardMaterial color={c.puf} roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.445, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.02, 28]} />
            <meshStandardMaterial color={c.pufTapa} roughness={0.95} />
          </mesh>
        </group>
      ))}
    </>
  )
}
