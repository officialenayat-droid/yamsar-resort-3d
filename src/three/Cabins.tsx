import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { makePrism, makeTriangle, groundHeight } from './geometry'
import { popScale, world, now, lerp } from './world'
import { actions, useStore, getState } from '../state/store'
import { audio } from '../audio/AudioEngine'
import type { CabinId } from '../data'
import { useStay } from '../state/config'

export const CABIN_SPOTS: { id: CabinId; x: number; z: number; rot: number; delay: number }[] = [
  { id: 'aframe', x: 5.6, z: -2.2, rot: -0.45, delay: 0.95 },
  { id: 'riverfront', x: -5.0, z: 1.6, rot: 0.55, delay: 1.1 },
  { id: 'glacier', x: 7.2, z: 5.6, rot: -0.85, delay: 1.25 },
]

const cedar = '#8a5a43'
const cedarDark = '#6E473B'
const deckWood = '#a57a58'

function useWindowMaterial(id: CabinId) {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2b3d45', emissive: new THREE.Color('#ffb15a'), emissiveIntensity: 0.3, roughness: 0.15, metalness: 0.4 }),
    [],
  )
  const light = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const lit = getState().lit[id] ? 1 : 0
    const n = world.night
    mat.emissiveIntensity = 0.12 + n * 2.3 + lit * (0.6 + Math.sin(now() * 9) * 0.08) + Math.sin(now() * 3 + id.length) * 0.05 * n
    if (light.current) light.current.intensity = n * 6 + lit * 3
  })
  return { mat, light }
}

function Smoke({ x, y, z }: { x: number; y: number; z: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    const t = now()
    refs.current.forEach((m, i) => {
      if (!m) return
      const k = (t * 0.35 + i / 4) % 1
      m.position.set(x + Math.sin(k * 5 + i) * 0.18, y + k * 2.2, z + k * 0.4)
      m.scale.setScalar(0.12 + k * 0.35)
      ;(m.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.38 * (0.35 + world.night * 0.65)
    })
  })
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(m) => void (refs.current[i] = m)}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color="#e9e4dc" transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

function AFrame({ win }: { win: THREE.Material }) {
  const shell = useMemo(() => makePrism(3.2, 3.6, 3.4), [])
  const glass = useMemo(() => makeTriangle(2.5, 2.8), [])
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 0.18, 5]} />
        <meshStandardMaterial color={deckWood} roughness={0.9} />
      </mesh>
      <mesh geometry={shell} position={[0, 0.34, -0.2]} castShadow>
        <meshStandardMaterial color={cedarDark} roughness={0.8} flatShading />
      </mesh>
      <mesh geometry={glass} material={win} position={[0, 0.5, 1.52]} />
      <mesh position={[0, 1.65, 1.54]}>
        <boxGeometry args={[0.07, 2.4, 0.06]} />
        <meshStandardMaterial color="#3b2a22" />
      </mesh>
      <mesh position={[0, 1.4, 1.54]}>
        <boxGeometry args={[1.7, 0.06, 0.06]} />
        <meshStandardMaterial color="#3b2a22" />
      </mesh>
      <mesh position={[0.8, 3.0, -0.8]} castShadow>
        <boxGeometry args={[0.32, 0.9, 0.32]} />
        <meshStandardMaterial color="#3a3330" />
      </mesh>
      {/* snow on the ridge */}
      <mesh position={[0, 3.92, -0.2]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.12, 0.12, 3.5, 6]} />
        <meshStandardMaterial color="#f5f7f8" roughness={1} />
      </mesh>
    </group>
  )
}

function Heritage({ win }: { win: THREE.Material }) {
  const roof = useMemo(() => makePrism(3.9, 1.5, 3.3), [])
  return (
    <group>
      <mesh position={[0, 0.2, 0.3]} receiveShadow castShadow>
        <boxGeometry args={[3.6, 0.2, 3.8]} />
        <meshStandardMaterial color="#8d8478" roughness={1} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.9, 1.5, 2.6]} />
        <meshStandardMaterial color="#d9cbb2" roughness={0.95} />
      </mesh>
      {/* timber-laced upper storey (dhajji dewari) with overhanging balcony */}
      <mesh position={[0, 2.25, 0.15]} castShadow>
        <boxGeometry args={[3.3, 0.95, 2.95]} />
        <meshStandardMaterial color={cedar} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.83, 1.72]}>
        <boxGeometry args={[3.3, 0.08, 0.35]} />
        <meshStandardMaterial color="#5a3b2d" />
      </mesh>
      <mesh geometry={roof} position={[0, 2.72, 0.15]} castShadow>
        <meshStandardMaterial color="#3f6150" roughness={0.6} metalness={0.3} flatShading />
      </mesh>
      {[-0.9, 0, 0.9].map((x) => (
        <mesh key={x} material={win} position={[x, 2.25, 1.64]}>
          <planeGeometry args={[0.55, 0.6]} />
        </mesh>
      ))}
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} material={win} position={[x, 1.0, 1.31]}>
          <planeGeometry args={[0.6, 0.75]} />
        </mesh>
      ))}
      <mesh position={[-1.0, 3.6, -0.4]} castShadow>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color="#3a3330" />
      </mesh>
    </group>
  )
}

function Duplex({ win }: { win: THREE.Material }) {
  const roof = useMemo(() => makePrism(3.4, 1.9, 3.2), [])
  return (
    <group>
      <mesh position={[0, 0.22, 0.6]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.2, 4.2]} />
        <meshStandardMaterial color={deckWood} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 3.3, 2.8]} />
        <meshStandardMaterial color="#5c3d31" roughness={0.85} />
      </mesh>
      <mesh material={win} position={[0, 1.95, 1.41]}>
        <planeGeometry args={[2.4, 2.9]} />
      </mesh>
      <mesh position={[0, 1.95, 1.43]}>
        <boxGeometry args={[2.5, 0.07, 0.05]} />
        <meshStandardMaterial color="#2c211c" />
      </mesh>
      <mesh position={[0, 1.95, 1.43]}>
        <boxGeometry args={[0.06, 2.9, 0.05]} />
        <meshStandardMaterial color="#2c211c" />
      </mesh>
      <mesh position={[0, 2.0, 1.75]}>
        <boxGeometry args={[3.1, 0.08, 0.7]} />
        <meshStandardMaterial color="#3b2a22" />
      </mesh>
      <mesh geometry={roof} position={[0, 3.6, 0]} castShadow>
        <meshStandardMaterial color="#39403f" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 5.48, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.13, 0.13, 3.3, 6]} />
        <meshStandardMaterial color="#f5f7f8" roughness={1} />
      </mesh>
      <mesh position={[1.0, 5.0, -0.6]} castShadow>
        <boxGeometry args={[0.32, 1.0, 0.32]} />
        <meshStandardMaterial color="#3a3330" />
      </mesh>
    </group>
  )
}

const CHIMNEY: Record<CabinId, [number, number, number]> = {
  aframe: [0.8, 3.5, -0.8],
  riverfront: [-1.0, 4.05, -0.4],
  glacier: [1.0, 5.55, -0.6],
}

function Cabin({ spot }: { spot: (typeof CABIN_SPOTS)[number] }) {
  const group = useRef<THREE.Group>(null)
  const { mat, light } = useWindowMaterial(spot.id)
  const [hover, setHover] = useState(false)
  const entered = useStore((s) => s.entered)
  const stay = useStay(spot.id)
  const y = groundHeight(spot.x, spot.z) - 0.1
  const hoverK = useRef(0)

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    hoverK.current = lerp(hoverK.current, hover ? 1 : 0, 1 - Math.exp(-dt * 10))
    const s = popScale(spot.delay)
    const h = 1 + hoverK.current * 0.06
    const xz = (0.55 + 0.45 * Math.min(1.15, s)) * h
    g.scale.set(Math.max(0.001, xz * (s > 0 ? 1 : 0)), Math.max(0.001, s * h), Math.max(0.001, xz))
  })

  const open = () => {
    audio.pop(1.1)
    actions.openCutaway(spot.id)
  }

  const Body = spot.id === 'aframe' ? AFrame : spot.id === 'riverfront' ? Heritage : Duplex
  const [cx, cy, cz] = CHIMNEY[spot.id]
  const labelY = spot.id === 'glacier' ? 6.6 : spot.id === 'aframe' ? 4.9 : 4.7

  return (
    <group position={[spot.x, y, spot.z]} rotation-y={spot.rot}>
      <group
        ref={group}
        scale={0.001}
        onClick={(e) => {
          e.stopPropagation()
          open()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
          audio.tap()
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
      >
        <Body win={mat} />
        <pointLight ref={light} position={[0, 1.4, 2.6]} color="#ffae5e" intensity={0} distance={7} decay={1.6} />
        <Smoke x={cx} y={cy} z={cz} />
      </group>
      {entered && (
        <Html position={[0, labelY, 0]} center zIndexRange={[20, 0]}>
          <button className={`hotspot ${hover ? 'is-hover' : ''}`} onClick={open} onMouseEnter={() => audio.tap()}>
            <span className="hotspot-dot" />
            <span className="hotspot-label">{stay.short}</span>
          </button>
        </Html>
      )}
    </group>
  )
}

export function Cabins() {
  return (
    <>
      {CABIN_SPOTS.map((s) => (
        <Cabin key={s.id} spot={s} />
      ))}
    </>
  )
}
