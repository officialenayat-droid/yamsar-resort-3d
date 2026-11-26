import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { groundHeight } from './geometry'
import { popScale, now, lerp } from './world'
import { actions, useStore, getState } from '../state/store'
import { audio } from '../audio/AudioEngine'

export const HERO_TREE = { x: -5.2, z: 7.4, scale: 2.1 }
const SNOW_COUNT = 320

/** The great deodar: shake it to drop snow and reveal a snow-leopard cub. */
export function HeroDeodar({ geometry, material }: { geometry: THREE.BufferGeometry; material: THREE.Material }) {
  const tree = useRef<THREE.Group>(null)
  const pop = useRef<THREE.Group>(null)
  const snow = useRef<THREE.Points>(null)
  const leopard = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const st = useRef({ shake: 0, snowT: -10, peekUntil: 0, peek: 0, hop: -10 })
  const found = useStore((s) => s.found.deodar)
  const entered = useStore((s) => s.entered)
  const y = groundHeight(HERO_TREE.x, HERO_TREE.z) - 0.05

  const snowData = useMemo(() => {
    const pos = new Float32Array(SNOW_COUNT * 3)
    const vel = new Float32Array(SNOW_COUNT * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { g, pos, vel }
  }, [])

  const rustle = () => {
    const s = st.current
    if (s.shake > 0.35) return
    s.shake = 1
    s.snowT = now()
    audio.rustle()
    const H = 2.8 * HERO_TREE.scale
    for (let i = 0; i < SNOW_COUNT; i++) {
      const yy = (0.25 + Math.random() * 0.75) * H
      const r = (1 - yy / H) * 2.1 * Math.sqrt(Math.random())
      const a = Math.random() * Math.PI * 2
      snowData.pos.set([Math.cos(a) * r, yy, Math.sin(a) * r], i * 3)
      snowData.vel.set([Math.cos(a) * (0.4 + Math.random()), Math.random() * 0.8, Math.sin(a) * (0.4 + Math.random())], i * 3)
    }
    snowData.g.attributes.position.needsUpdate = true
    window.setTimeout(() => {
      s.peekUntil = now() + 9
      audio.chuff()
    }, 900)
    if (!getState().found.deodar) {
      window.setTimeout(() => actions.discover('deodar'), 1700)
    }
  }

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const s = st.current
    const t = now()
    const p = popScale(0.7)
    if (pop.current) pop.current.scale.set(Math.max(0.001, 0.6 + 0.4 * Math.min(p, 1.2)), Math.max(0.001, p), Math.max(0.001, 0.6 + 0.4 * Math.min(p, 1.2)))
    s.shake = Math.max(0, s.shake - dt * 0.9)
    if (tree.current) {
      tree.current.rotation.z = Math.sin(t * 24) * 0.07 * s.shake
      tree.current.rotation.x = Math.cos(t * 19) * 0.05 * s.shake
    }
    // snow fall
    const age = t - s.snowT
    if (snow.current) {
      snow.current.visible = age < 7
      if (age < 7) {
        const P = snowData.pos
        const V = snowData.vel
        for (let i = 0; i < SNOW_COUNT; i++) {
          const k = i * 3
          if (P[k + 1] <= 0.03) continue
          V[k + 1] -= 3.2 * dt
          V[k] *= 0.985
          V[k + 2] *= 0.985
          V[k + 1] = Math.max(V[k + 1], -1.6 - (i % 5) * 0.2)
          P[k] += V[k] * dt + Math.sin(t * 3 + i) * 0.004
          P[k + 1] = Math.max(0.03, P[k + 1] + V[k + 1] * dt)
          P[k + 2] += V[k + 2] * dt
        }
        snowData.g.attributes.position.needsUpdate = true
        ;(snow.current.material as THREE.PointsMaterial).opacity = age > 5 ? Math.max(0, 1 - (age - 5) / 2) : 1
      }
    }
    // leopard peeks out from behind the trunk
    s.peek = lerp(s.peek, t < s.peekUntil ? 1 : 0, 1 - Math.exp(-dt * 4))
    if (leopard.current) {
      leopard.current.visible = s.peek > 0.01
      const hop = t - s.hop < 0.5 ? Math.sin(((t - s.hop) / 0.5) * Math.PI) * 0.35 : 0
      leopard.current.position.set(lerp(0.1, 1.8, s.peek), hop, lerp(-1.0, 0.7, s.peek))
      leopard.current.rotation.y = lerp(-1.6, -0.75, s.peek)
    }
    if (head.current) head.current.rotation.z = Math.sin(t * 1.8) * 0.18 + 0.12
  })

  return (
    <group position={[HERO_TREE.x, y, HERO_TREE.z]}>
      <group ref={pop} scale={0.001}>
        <group ref={tree} scale={HERO_TREE.scale}>
          <mesh geometry={geometry} material={material} castShadow />
        </group>
        {/* generous invisible hit volume */}
        <mesh
          position={[0, 2.6, 0]}
          onClick={(e) => {
            e.stopPropagation()
            rustle()
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.style.cursor = 'grab'
            audio.tap()
          }}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          <cylinderGeometry args={[1.5, 2.1, 5.4, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      <points ref={snow} geometry={snowData.g} visible={false}>
        <pointsMaterial color="#ffffff" size={0.09} transparent depthWrite={false} sizeAttenuation />
      </points>
      <group
        ref={leopard}
        visible={false}
        onClick={(e) => {
          e.stopPropagation()
          st.current.hop = now()
          st.current.peekUntil = Math.max(st.current.peekUntil, now() + 4)
          audio.chuff()
        }}
      >
        <SnowLeopardCub headRef={head} />
      </group>
      {entered && !found && (
        <Html position={[0, 6.4, 0]} center zIndexRange={[20, 0]}>
          <button className="hotspot hotspot-hint" onClick={rustle}>
            <span className="hotspot-dot" />
            <span className="hotspot-label">Shake me</span>
          </button>
        </Html>
      )}
    </group>
  )
}

function SnowLeopardCub({ headRef }: { headRef: React.RefObject<THREE.Group | null> }) {
  const fur = '#e9e5dc'
  const furShade = '#cfc8bb'
  const spot = '#3b3532'
  return (
    <group scale={1.3}>
      {/* body */}
      <mesh position={[-0.35, 0.3, 0]} scale={[0.55, 0.3, 0.3]} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={furShade} roughness={1} />
      </mesh>
      {[
        [-0.2, 0.52, 0.12],
        [-0.5, 0.5, -0.1],
        [-0.65, 0.42, 0.15],
        [-0.3, 0.48, -0.2],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial color={spot} />
        </mesh>
      ))}
      {/* paws */}
      {[0.05, -0.65].map((x) =>
        [0.13, -0.13].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.08, z]} scale={[0.13, 0.08, 0.1]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color={fur} roughness={1} />
          </mesh>
        )),
      )}
      {/* thick tail curling up */}
      <mesh position={[-0.95, 0.55, 0]} rotation-z={0.4}>
        <torusGeometry args={[0.32, 0.09, 8, 16, Math.PI * 1.1]} />
        <meshStandardMaterial color={furShade} roughness={1} />
      </mesh>
      {/* head */}
      <group ref={headRef} position={[0.2, 0.62, 0]}>
        <mesh scale={[0.3, 0.27, 0.3]} castShadow>
          <sphereGeometry args={[1, 18, 14]} />
          <meshStandardMaterial color={fur} roughness={1} />
        </mesh>
        <mesh position={[0.22, -0.07, 0]} scale={[0.13, 0.1, 0.15]}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color="#f7f4ee" roughness={1} />
        </mesh>
        <mesh position={[0.34, -0.04, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#d9908a" />
        </mesh>
        {[0.11, -0.11].map((z) => (
          <group key={z}>
            <mesh position={[0.22, 0.06, z]}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color="#9fb7a6" roughness={0.2} />
            </mesh>
            <mesh position={[0.26, 0.06, z * 1.02]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#111" />
            </mesh>
            <mesh position={[-0.02, 0.24, z * 1.5]} rotation-x={z > 0 ? 0.4 : -0.4}>
              <coneGeometry args={[0.08, 0.14, 8]} />
              <meshStandardMaterial color={furShade} roughness={1} />
            </mesh>
          </group>
        ))}
        {[
          [0.0, 0.2, 0.06],
          [-0.08, 0.16, -0.12],
          [0.05, 0.22, -0.04],
          [-0.12, 0.05, 0.2],
          [-0.15, 0.1, -0.18],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshBasicMaterial color={spot} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
