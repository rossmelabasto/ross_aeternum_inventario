import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OJOS, libre } from './layout.js'

const VEL = 2.4 // m/s caminando
const CORRER = 1.9 // multiplicador con Shift
const GIRO = 1.9 // rad/s con ← →
const SENS = 0.0042 // rad por píxel al arrastrar
const PITCH = 1.1

const pulsada = (t, ...codigos) => codigos.some((c) => t.has(c))
const cerca = (a, b) => Math.abs(a - b) < 0.02
const angulo = (a) => Math.atan2(Math.sin(a), Math.cos(a))

/**
 * Cámara en primera persona.
 * - W/S o ↑/↓: avanzar y retroceder · A/D: paso lateral · ←/→: girar · Shift: correr
 * - Arrastrar con el mouse (o el dedo): mirar
 * - control.objetivo = { x, z, yaw, pitch } lleva la cámara sola hasta ese punto
 */
export function Jugador({ teclas, control, estado, cajas, onLlegar }) {
  const { camera, gl } = useThree()

  useEffect(() => {
    const el = gl.domElement
    let previo = null
    const abajo = (e) => { if (e.button === 0) { previo = [e.clientX, e.clientY]; el.setPointerCapture?.(e.pointerId) } }
    const mover = (e) => {
      if (!previo) return
      const dx = e.clientX - previo[0], dy = e.clientY - previo[1]
      previo = [e.clientX, e.clientY]
      control.yaw += dx * SENS
      control.pitch = Math.max(-PITCH, Math.min(PITCH, control.pitch + dy * SENS))
      if (Math.abs(dx) + Math.abs(dy) > 1) control.objetivo = null
    }
    const arriba = () => { previo = null }
    el.addEventListener('pointerdown', abajo)
    el.addEventListener('pointermove', mover)
    el.addEventListener('pointerup', arriba)
    el.addEventListener('pointercancel', arriba)
    el.style.touchAction = 'none'
    return () => {
      el.removeEventListener('pointerdown', abajo)
      el.removeEventListener('pointermove', mover)
      el.removeEventListener('pointerup', arriba)
      el.removeEventListener('pointercancel', arriba)
    }
  }, [gl, control])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = teclas.current
    const avance = (pulsada(t, 'KeyW', 'ArrowUp') ? 1 : 0) - (pulsada(t, 'KeyS', 'ArrowDown') ? 1 : 0)
    const lado = (pulsada(t, 'KeyD') ? 1 : 0) - (pulsada(t, 'KeyA') ? 1 : 0)
    const giro = (pulsada(t, 'ArrowRight', 'KeyE') ? 1 : 0) - (pulsada(t, 'ArrowLeft', 'KeyQ') ? 1 : 0)
    const hayInput = avance || lado || giro

    if (hayInput) control.objetivo = null
    control.yaw -= giro * GIRO * dt

    const o = control.objetivo
    if (o) {
      // Recorrido automático hacia un producto (suavizado exponencial)
      const k = 1 - Math.exp(-dt * 3.2)
      control.x += (o.x - control.x) * k
      control.z += (o.z - control.z) * k
      control.yaw += angulo(o.yaw - control.yaw) * k
      control.pitch += (o.pitch - control.pitch) * k
      if (cerca(control.x, o.x) && cerca(control.z, o.z) && Math.abs(angulo(o.yaw - control.yaw)) < 0.01) {
        control.objetivo = null
        onLlegar?.()
      }
    } else {
      const v = VEL * (t.has('ShiftLeft') || t.has('ShiftRight') ? CORRER : 1)
      const fx = -Math.sin(control.yaw), fz = -Math.cos(control.yaw)
      const rx = Math.cos(control.yaw), rz = -Math.sin(control.yaw)
      let mx = fx * avance + rx * lado, mz = fz * avance + rz * lado
      const n = Math.hypot(mx, mz)
      if (n > 0) { mx /= n; mz /= n }
      // Inercia suave
      const k = 1 - Math.exp(-dt * 10)
      control.vx += (mx * v - control.vx) * k
      control.vz += (mz * v - control.vz) * k
      // Colisión por ejes: si choca en X, todavía puede deslizarse en Z
      const nx = control.x + control.vx * dt
      if (libre(nx, control.z, cajas)) control.x = nx; else control.vx = 0
      const nz = control.z + control.vz * dt
      if (libre(control.x, nz, cajas)) control.z = nz; else control.vz = 0
    }

    const rapidez = Math.hypot(control.vx, control.vz)
    control.paso += rapidez * dt * 2.2
    const bob = o ? 0 : Math.sin(control.paso * 2) * 0.025 * Math.min(1, rapidez / VEL)
    camera.position.set(control.x, OJOS + bob, control.z)
    camera.rotation.set(control.pitch, control.yaw, 0, 'YXZ')
    estado.x = control.x
    estado.z = control.z
    estado.yaw = control.yaw
  })

  return null
}
