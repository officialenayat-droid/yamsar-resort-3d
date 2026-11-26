import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { makeGround, makePeak, peakLayout, makeDeodar, groundHeight, distToRiver, type PeakSpec } from './geometry'
import { world, popScale, mulberry32, lerp, now } from './world'
import { River } from './River'
import { Cabins, CABIN_SPOTS } from './Cabins'
import { HeroDeodar, HERO_TREE } from './HeroDeodar'
import { SkyDome, Stars, Celestial, ShootingStar, DAY_FOG, NIGHT_FOG } from './Sky'
import { useStore } from '../state/store'
import type { CameraPreset } from '../data'

// ───────────────────────── camera ─────────────────────────
const PRESETS: Record<CameraPreset | 'gate', { pos: [number, number, number]; target: [number, number, number] }> = {
  gate: { pos: [0, 26, 40], target: [0, 0, -4] },
  overview: { pos: [0, 7.5, 24], target: [0, 3.2, -6] },
  river: { pos: [5.5, 2.8, 14.5], target: [-0.5, 1.0, 3.5] },
  glacier: { pos: [10, 9.5, -3], target: [-4, 8.5, -24] },
}

function CameraRig() {
  const preset = useStore((s) => s.camera)
  const entered = useStore((s) => s.entered)
  const { camera, size } = useThree()
  const target = useRef(new THREE.Vector3(...PRESETS.gate.target))
  const desiredPos = useMemo(() => new THREE.Vector3(), [])
  const desiredTarget = useMemo(() => new THREE.Vector3(), [])
  const offset = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const p = PRESETS[entered ? preset : 'gate']
    desiredTarget.set(...p.target)
    offset.set(...p.pos).sub(desiredTarget)
    // pull back on portrait screens so the valley still fits
    const aspect = size.width / size.height
    if (aspect < 1.2) offset.multiplyScalar(1 + (1.2 - aspect) * 0.75)
    desiredPos.copy(desiredTarget).add(offset)
    // scroll-linked flight: dive down the valley toward the river
    const s = world.scroll
    desiredPos.x += -1.5 * s
    desiredPos.y += -3.2 * s
    desiredPos.z += -9 * s
    desiredTarget.y += -1.6 * s
    desiredTarget.z += -3 * s
    // cursor parallax
    desiredPos.x += world.mouseX * 1.4
    desiredPos.y += -world.mouseY * 0.7
    const k = 1 - Math.exp(-dt * (entered ? 1.9 : 0.8))
    camera.position.lerp(desiredPos, k)
    target.current.lerp(desiredTarget, k)
    camera.lookAt(target.current)
  })
  return null
}

// ───────────────────────── day / night ─────────────────────────
function Atmosphere() {
  const { scene } = useThree()
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const amb = useRef<THREE.AmbientLight>(null)
  const sunDay = useMemo(() => new THREE.Color('#fff1da'), [])
  const sunNight = useMemo(() => new THREE.Color('#8fa6d8'), [])
  const skyDay = useMemo(() => new THREE.Color('#cfe3ee'), [])
  const skyNight = useMemo(() => new THREE.Color('#33446e'), [])
  const gDay = useMemo(() => new THREE.Color('#9b8a6a'), [])
  const gNight = useMemo(() => new THREE.Color('#141a22'), [])
  const fog = useMemo(() => new THREE.Fog(DAY_FOG.clone(), 34, 120), [])

  useEffect(() => {
    scene.fog = fog
    return () => {
      scene.fog = null
    }
  }, [scene, fog])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    world.night = lerp(world.night, world.nightTarget, 1 - Math.exp(-dt * 1.4))
    if (Math.abs(world.night - world.nightTarget) < 0.001) world.night = world.nightTarget
    const n = world.night
    fog.color.copy(DAY_FOG).lerp(NIGHT_FOG, n)
    fog.near = lerp(34, 26, n)
    fog.far = lerp(120, 95, n)
    if (sun.current) {
      sun.current.color.copy(sunDay).lerp(sunNight, n)
      sun.current.intensity = lerp(2.6, 0.55, n)
      sun.current.position.set(lerp(14, -12, n), lerp(22, 18, n), lerp(10, 2, n))
    }
    if (hemi.current) {
      hemi.current.color.copy(skyDay).lerp(skyNight, n)
      hemi.current.groundColor.copy(gDay).lerp(gNight, n)
      hemi.current.intensity = lerp(1.15, 0.45, n)
    }
    if (amb.current) amb.current.intensity = lerp(0.25, 0.12, n)
  })

  const lowPower = world.lowPower
  return (
    <>
      <ambientLight ref={amb} intensity={0.25} />
      <hemisphereLight ref={hemi} intensity={1.15} />
      <directionalLight
        ref={sun}
        castShadow={!lowPower}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
    </>
  )
}

// ───────────────────────── terrain + peaks ─────────────────────────
function Ground() {
  const geo = useMemo(makeGround, [])
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.95} />
    </mesh>
  )
}

const peakMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 })

function Peak({ spec }: { spec: PeakSpec }) {
  const geo = useMemo(() => makePeak(spec.r, spec.h, spec.seed, spec.snow), [spec])
  const ref = useRef<THREE.Group>(null)
  const entered = useStore((s) => s.entered)
  const baseY = groundHeight(spec.x, spec.z) - 0.6
  useFrame(() => {
    const s = popScale(spec.delay)
    const xz = 0.7 + 0.3 * Math.min(1.1, s)
    ref.current?.scale.set(xz, Math.max(0.001, s), xz)
  })
  return (
    <group position={[spec.x, baseY, spec.z]}>
      <group ref={ref} scale={0.001}>
        <mesh geometry={geo} material={peakMaterial} castShadow receiveShadow />
      </group>
      {spec.label && entered && (
        <Html position={[0, spec.h + 1.6, 0]} center zIndexRange={[10, 0]}>
          <div className="peak-flag">
            <span>▲</span> {spec.label}
          </div>
        </Html>
      )}
    </group>
  )
}

function Mountains() {
  const peaks = useMemo(peakLayout, [])
  return (
    <>
      {peaks.map((p, i) => (
        <Peak key={i} spec={p} />
      ))}
    </>
  )
}

// ───────────────────────── forest ─────────────────────────
interface TreeSpec {
  x: number
  y: number
  z: number
  s: number
  rot: number
  delay: number
}

function useForestLayout(count: number) {
  return useMemo(() => {
    const rnd = mulberry32(2024)
    const out: TreeSpec[] = []
    let guard = 0
    // cluster centres give the grove a hand-placed feel
    const clusters = [
      [-9, -6],
      [-11, 4],
      [10, -7],
      [12, 1],
      [-7, 11],
      [9, 11],
      [-14, -2],
      [15, 7],
      [3, -11],
      [-6, -11],
    ]
    while (out.length < count && guard++ < 6000) {
      const c = clusters[Math.floor(rnd() * clusters.length)]
      const x = c[0] + (rnd() - 0.5) * 9
      const z = c[1] + (rnd() - 0.5) * 8
      if (Math.abs(x) > 22 || z < -13 || z > 18) continue
      if (distToRiver(x, z) < 2.6) continue
      if (CABIN_SPOTS.some((cs) => Math.hypot(cs.x - x, cs.z - z) < 3.2)) continue
      if (Math.hypot(HERO_TREE.x - x, HERO_TREE.z - z) < 2.8) continue
      if (z > 11 && Math.abs(x) < 7.5) continue // keep the camera's foreground clear
      if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 1.05)) continue
      const d = Math.hypot(x, z)
      out.push({ x, z, y: groundHeight(x, z) - 0.05, s: 0.75 + rnd() * 0.75, rot: rnd() * Math.PI * 2, delay: 0.45 + d * 0.025 + rnd() * 0.12 })
    }
    return out
  }, [count])
}

const treeMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 })

function Forest({ geometry }: { geometry: THREE.BufferGeometry }) {
  const trees = useForestLayout(world.lowPower ? 55 : 95)
  const ref = useRef<THREE.InstancedMesh>(null)
  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const p = useMemo(() => new THREE.Vector3(), [])
  const sc = useMemo(() => new THREE.Vector3(), [])
  const yAxis = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const settled = useRef(-999)

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    // once every tree has settled, stop rewriting matrices (except for the gentle sway)
    const t = now()
    const sinceStart = world.popStart < 0 ? -1 : t - world.popStart
    const animating = sinceStart >= 0 && sinceStart < 4.5
    if (!animating) {
      if (settled.current === world.popStart) return
      settled.current = world.popStart
    }
    trees.forEach((tr, i) => {
      const s = popScale(tr.delay, t)
      p.set(tr.x, tr.y, tr.z)
      q.setFromAxisAngle(yAxis, tr.rot)
      const xz = tr.s * (0.6 + 0.4 * Math.min(1.15, s))
      sc.set(Math.max(0.001, xz), Math.max(0.001, tr.s * s), Math.max(0.001, xz))
      m.compose(p, q, sc)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  })

  return <instancedMesh ref={ref} args={[geometry, treeMaterial, trees.length]} castShadow receiveShadow frustumCulled={false} />
}

// ───────────────────────── scene ─────────────────────────
/** Dev-only: expose camera so automated tests can click real 3D objects. */
function DevHandle() {
  const { camera, size } = useThree()
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as Record<string, unknown>).__yamsar3d = {
      project: (x: number, y: number, z: number) => {
        const v = new THREE.Vector3(x, y, z).project(camera)
        return { x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height }
      },
    }
  }, [camera, size])
  return null
}

function Scene() {
  const deodar = useMemo(makeDeodar, [])
  return (
    <>
      <DevHandle />
      <CameraRig />
      <Atmosphere />
      <SkyDome />
      <Stars />
      <Celestial />
      <ShootingStar />
      <Ground />
      <Mountains />
      <River />
      <Forest geometry={deodar} />
      <HeroDeodar geometry={deodar} material={treeMaterial} />
      <Cabins />
      <Meadow />
    </>
  )
}

/** Scattered boulders and wildflower tufts on the banks — static, merged per material. */
function Meadow() {
  const rocks = useMemo(() => {
    const rnd = mulberry32(5)
    const out: { x: number; y: number; z: number; s: number; r: number }[] = []
    for (let i = 0; i < 46; i++) {
      const t = rnd()
      const idx = Math.floor(t * 250)
      const ang = rnd() < 0.5 ? 1 : -1
      // stones along the river banks
      const x0 = -3 + rnd() * 6
      const z0 = -12 + (idx / 250) * 34
      const x = x0 + ang * (1.6 + rnd() * 1.4)
      const z = z0
      if (distToRiver(x, z) < 1.2 || distToRiver(x, z) > 3.2) continue
      out.push({ x, z, y: groundHeight(x, z), s: 0.15 + rnd() * 0.35, r: rnd() * 6 })
    }
    return out
  }, [])
  return (
    <>
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, r.y + r.s * 0.3, r.z]} rotation={[r.r, r.r * 2, 0]} scale={[r.s * 1.3, r.s, r.s]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 3 ? '#9aa09b' : '#b5b2a8'} flatShading roughness={0.9} />
        </mesh>
      ))}
    </>
  )
}

export default function HimalayanDiorama({ active = true }: { active?: boolean }) {
  const lowPower = useMemo(() => {
    const lp = window.matchMedia('(max-width: 768px)').matches || (navigator.hardwareConcurrency ?? 8) <= 4
    world.lowPower = lp
    return lp
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      world.mouseX = (e.clientX / window.innerWidth) * 2 - 1
      world.mouseY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <Canvas
      shadows={!lowPower}
      dpr={[1, lowPower ? 1.5 : 2]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 50, near: 0.1, far: 500, position: PRESETS.gate.pos }}
      gl={{ antialias: !lowPower, powerPreference: 'high-performance' }}
      onPointerMissed={() => (document.body.style.cursor = '')}
    >
      <Scene />
    </Canvas>
  )
}
