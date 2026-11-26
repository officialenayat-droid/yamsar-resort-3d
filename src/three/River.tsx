import { useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { RIVER_SAMPLES, RIVER_WIDTH, nearestRiverIndex, riverPts, riverTangents } from './geometry'
import { now, world, clamp01 } from './world'
import { audio } from '../audio/AudioEngine'

const WATER_Y = 0.04

const vert = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`
const frag = /* glsl */ `
  #include <fog_pars_fragment>
  uniform float uTime;
  uniform float uNight;
  uniform float uReveal;
  varying vec2 vUv;
  varying vec3 vWorld;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
  void main() {
    if (vUv.y > uReveal) discard;
    float across = vUv.x;
    float edge = smoothstep(0.0, 0.22, across) * smoothstep(1.0, 0.78, across);
    float flow = vUv.y * 160.0 - uTime * 2.4;
    float w1 = sin(flow + sin(across * 9.0 + uTime * 0.8) * 2.0);
    float w2 = sin(flow * 0.63 + across * 14.0 - uTime * 1.3);
    float streak = pow(max(0.0, w1 * 0.5 + 0.5), 10.0) + pow(max(0.0, w2 * 0.5 + 0.5), 14.0) * 0.7;
    vec3 deepDay = vec3(0.10, 0.42, 0.42);
    vec3 shallowDay = vec3(0.42, 0.78, 0.74);
    vec3 deepNight = vec3(0.03, 0.09, 0.13);
    vec3 shallowNight = vec3(0.10, 0.20, 0.27);
    vec3 deep = mix(deepDay, deepNight, uNight);
    vec3 shallow = mix(shallowDay, shallowNight, uNight);
    vec3 col = mix(shallow, deep, edge);
    vec3 glint = mix(vec3(1.0, 0.98, 0.92), vec3(0.75, 0.82, 1.0), uNight);
    col += glint * streak * (0.35 + 0.25 * edge) * (1.0 - uNight * 0.5);
    // foam along the banks
    float foam = 1.0 - smoothstep(0.0, 0.09, min(across, 1.0 - across));
    foam *= 0.6 + 0.4 * sin(flow * 0.5 + hash(floor(vWorld.xz * 6.0)) * 6.28);
    col = mix(col, vec3(0.95, 0.97, 0.96) * (1.0 - uNight * 0.6), clamp(foam, 0.0, 1.0) * 0.8);
    // leading edge of the newly-revealed water froths
    float front = smoothstep(uReveal - 0.02, uReveal, vUv.y) * step(uReveal, 0.999);
    col = mix(col, vec3(1.0), front);
    gl_FragColor = vec4(col, 0.76 + edge * 0.12);
    #include <fog_fragment>
  }
`

function makeRibbon() {
  const n = riverPts.length
  const positions = new Float32Array(n * 2 * 3)
  const uvs = new Float32Array(n * 2 * 2)
  const idx: number[] = []
  for (let i = 0; i < n; i++) {
    const p = riverPts[i]
    const t = riverTangents[i]
    const nx = -t.z
    const nz = t.x
    const w = RIVER_WIDTH / 2 + 0.25 + Math.sin(i * 0.21) * 0.15
    positions.set([p.x + nx * w, WATER_Y, p.z + nz * w, p.x - nx * w, WATER_Y, p.z - nz * w], i * 6)
    uvs.set([0, i / (n - 1), 1, i / (n - 1)], i * 4)
    if (i < n - 1) {
      const a = i * 2
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

interface Splash {
  id: number
  x: number
  z: number
  t0: number
  idx: number
}
let uid = 0

export function River() {
  const geo = useMemo(makeRibbon, [])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        fog: true,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          { uTime: { value: 0 }, uNight: { value: 0 }, uReveal: { value: 0 } },
        ]),
      }),
    [],
  )
  const [splashes, setSplashes] = useState<Splash[]>([])

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime
    mat.uniforms.uNight.value = world.night
    mat.uniforms.uReveal.value = world.popStart < 0 ? 0 : clamp01((now() - world.popStart - 0.5) / 1.8)
  })

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (mat.uniforms.uReveal.value < 0.5) return
    const s: Splash = { id: ++uid, x: e.point.x, z: e.point.z, t0: now(), idx: nearestRiverIndex(e.point.x, e.point.z) }
    setSplashes((a) => [...a.slice(-5), s])
    audio.splash()
    window.setTimeout(() => setSplashes((a) => a.filter((q) => q.id !== s.id)), 5600)
  }

  return (
    <group>
      <mesh
        geometry={geo}
        material={mat}
        renderOrder={2}
        onPointerDown={onDown}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
          audio.tap()
        }}
        onPointerOut={() => (document.body.style.cursor = '')}
      />
      {splashes.map((s) => (
        <SplashFx key={s.id} s={s} />
      ))}
    </group>
  )
}

function SplashFx({ s }: { s: Splash }) {
  return (
    <group>
      {[0, 0.22, 0.48].map((d) => (
        <Ripple key={d} x={s.x} z={s.z} t0={s.t0 + d} />
      ))}
      <Trout s={s} lane={-0.35} delay={0} jump />
      <Trout s={s} lane={0.4} delay={0.25} />
      <Trout s={s} lane={0.05} delay={0.5} />
    </group>
  )
}

function Ripple({ x, z, t0 }: { x: number; z: number; t0: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    const k = (now() - t0) / 1.7
    if (!ref.current || !mat.current) return
    ref.current.visible = k > 0 && k < 1
    const s = 0.15 + k * 1.6
    ref.current.scale.set(s, s, s)
    mat.current.opacity = (1 - k) * 0.85
  })
  return (
    <mesh ref={ref} position={[x, WATER_Y + 0.02, z]} rotation-x={-Math.PI / 2} renderOrder={3} visible={false}>
      <ringGeometry args={[0.82, 1, 48]} />
      <meshBasicMaterial ref={mat} color="#f6fbfa" transparent depthWrite={false} />
    </mesh>
  )
}

const tmp = new THREE.Vector3()

function Trout({ s, lane, delay, jump = false }: { s: Splash; lane: number; delay: number; jump?: boolean }) {
  const group = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const dir = s.idx > RIVER_SAMPLES - 30 ? -1 : 1
  useFrame(() => {
    const g = group.current
    if (!g) return
    const t = now() - s.t0 - delay
    if (t < 0) {
      g.visible = false
      return
    }
    g.visible = true
    const f = Math.max(0, Math.min(RIVER_SAMPLES, s.idx + dir * t * 7))
    const i0 = Math.floor(f)
    const i1 = Math.min(RIVER_SAMPLES, i0 + 1)
    tmp.copy(riverPts[i0]).lerp(riverPts[i1], f - i0)
    const tan = riverTangents[i0]
    const wig = Math.sin(t * 2.3 + lane * 4) * 0.18
    tmp.x += -tan.z * (lane + wig)
    tmp.z += tan.x * (lane + wig)
    let y = -0.13
    let pitch = 0
    if (jump && t < 0.9) {
      const k = t / 0.9
      y = -0.13 + Math.sin(Math.PI * k) * 0.85
      pitch = Math.cos(Math.PI * k) * 0.9
    }
    g.position.set(tmp.x, y, tmp.z)
    const tx = tan.x * dir
    const tz = tan.z * dir
    g.rotation.set(0, Math.atan2(-tz, tx), pitch, 'YXZ')
    const fade = t > 4.2 ? Math.max(0.001, 1 - (t - 4.2) / 0.6) : Math.min(1, t * 4)
    g.scale.setScalar(fade)
    if (tail.current) tail.current.rotation.y = Math.sin(t * 16) * 0.55
  })
  return (
    <group ref={group} visible={false}>
      <mesh scale={[0.42, 0.13, 0.12]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color="#8a7440" roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh position={[0.02, -0.03, 0]} scale={[0.36, 0.07, 0.1]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#e4d6b0" roughness={0.6} />
      </mesh>
      {[
        [0.12, 0.08, 0.07, '#5a3d1e'],
        [-0.05, 0.09, -0.07, '#5a3d1e'],
        [-0.18, 0.06, 0.08, '#b04a2e'],
        [0.05, 0.1, 0.0, '#b04a2e'],
      ].map(([x, y, z, c], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color={c as string} />
        </mesh>
      ))}
      <mesh position={[0.32, 0.03, 0.07]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <group ref={tail} position={[-0.38, 0, 0]}>
        <mesh position={[-0.1, 0, 0]} rotation-z={-Math.PI / 2} scale={[1, 1, 0.35]}>
          <coneGeometry args={[0.14, 0.22, 4]} />
          <meshStandardMaterial color="#7a6436" roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}
