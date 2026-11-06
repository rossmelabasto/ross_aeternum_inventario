import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OJOS, libre } from './layout.js'

const VEL = 0.48 // m/s por cada punto de velocidad (5 → 2,4 m/s)
const GIRO = 1.9 // rad/s con ← →
const PITCH = 1.1

const pulsada = (t, ...codigos) => codigos.some((c) => t.has(c))
const cerca = (a, b) => Math.abs(a - b) < 0.02
const angulo = (a) => Math.atan2(Math.sin(a), Math.cos(a))

/**
 * Cámara en primera persona.
 * - W/S o ↑/↓: avanzar y retroceder · A/D: paso lateral · ←/→: girar
 * - Clic en la escena: captura el mouse para mirar (Esc lo suelta) · en pantallas táctiles, arrastrar
 * - control.objetivo = { x, z, yaw, pitch } lleva la cámara sola hasta ese punto
 */
export function Jugador({ teclas, control, estado, cajas, productos, onLlegar, onElegir, onBloqueo, onApuntar }) {
  const { camera, gl } = useThree()

  useEffect(() => {
    const el = gl.domElement
    el.style.touchAction = 'none'
    // Arrastrar para mirar: solo con el dedo o lápiz (en el celular no existe pointer lock)
    let previo = null
    const abajo = (e) => {
      if (e.pointerType === 'mouse' || e.button !== 0) return
      previo = [e.clientX, e.clientY]
      el.setPointerCapture?.(e.pointerId)
    }
    const arrastrar = (e) => {
      if (!previo) return
      const dx = e.clientX - previo[0], dy = e.clientY - previo[1]
      previo = [e.clientX, e.clientY]
      const k = control.sens * 0.0012
      control.yaw += dx * k
      control.pitch = Math.max(-PITCH, Math.min(PITCH, control.pitch + dy * k))
      if (Math.abs(dx) + Math.abs(dy) > 1) control.objetivo = null
    }
    const soltar = () => { previo = null }

    // Mouse capturado (pointer lock), como en Minecraft
    const mirar = (e) => {
      if (!control.bloqueado) return
      const k = control.sens * 0.0006
      control.yaw -= e.movementX * k
      control.pitch = Math.max(-PITCH, Math.min(PITCH, control.pitch - e.movementY * k))
      control.objetivo = null
    }
    const clicBloqueado = (e) => {
      if (control.bloqueado && e.button === 0 && control.apuntado) {
        control.clicEnProducto = true // que el click que sigue no vuelva a capturar el mouse
        setTimeout(() => { control.clicEnProducto = false }, 300)
        onElegir?.(control.apuntado)
      }
    }
    // Clic con el mouse suelto: si no cayó sobre un producto, captura el mouse
    const clic = (e) => {
      if (control.bloqueado || e.pointerType === 'touch' || matchMedia('(pointer: coarse)').matches) return
      setTimeout(() => {
        if (!control.clicEnProducto) el.requestPointerLock?.()?.catch?.(() => {})
        control.clicEnProducto = false
      }, 0)
    }
    const cambio = () => {
      control.bloqueado = document.pointerLockElement === el
      onBloqueo?.(control.bloqueado)
    }

    el.addEventListener('pointerdown', abajo)
    el.addEventListener('pointermove', arrastrar)
    el.addEventListener('pointerup', soltar)
    el.addEventListener('pointercancel', soltar)
    el.addEventListener('click', clic)
    document.addEventListener('mousemove', mirar)
    document.addEventListener('mousedown', clicBloqueado)
    document.addEventListener('pointerlockchange', cambio)
    return () => {
      el.removeEventListener('pointerdown', abajo)
      el.removeEventListener('pointermove', arrastrar)
      el.removeEventListener('pointerup', soltar)
      el.removeEventListener('pointercancel', soltar)
      el.removeEventListener('click', clic)
      document.removeEventListener('mousemove', mirar)
      document.removeEventListener('mousedown', clicBloqueado)
      document.removeEventListener('pointerlockchange', cambio)
      if (document.pointerLockElement === el) document.exitPointerLock()
    }
  }, [gl, control, onElegir, onBloqueo])

  // Mira: con el mouse capturado, el producto apuntado es el del centro de la pantalla
  const rayo = useMemo(() => new THREE.Raycaster(undefined, undefined, 0.1, 7), [])
  const centro = useMemo(() => new THREE.Vector2(0, 0), [])
  const cuadro = useRef(0)

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
      const v = VEL * control.vel
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
    const bob = o ? 0 : Math.sin(control.paso * 2) * 0.025 * Math.min(1, rapidez / (VEL * 5))
    camera.position.set(control.x, OJOS + bob, control.z)
    camera.rotation.set(control.pitch, control.yaw, 0, 'YXZ')
    estado.x = control.x
    estado.z = control.z
    estado.yaw = control.yaw

    // Producto bajo la mira (cada 3 cuadros, basta y ahorra trabajo)
    if (control.bloqueado && productos.current && ++cuadro.current % 3 === 0) {
      rayo.setFromCamera(centro, camera)
      const hit = rayo.intersectObject(productos.current, true)[0]
      let slot = null
      for (let o = hit?.object; o; o = o.parent) if (o.userData.slot) { slot = o.userData.slot; break }
      if (slot !== control.apuntado) { control.apuntado = slot; onApuntar?.(slot) }
    } else if (!control.bloqueado && control.apuntado) {
      control.apuntado = null
      onApuntar?.(null)
    }
  })

  return null
}
