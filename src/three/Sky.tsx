import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getGlowTexture } from './geometry'
import { world, now, mulberry32 } from './world'
import { actions, useStore } from '../state/store'
import { audio } from '../audio/AudioEngine'

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFrag = /* glsl */ `
  uniform float uNight;
  varying vec3 vDir;
  void main() {
    float h = smoothstep(-0.02, 0.55, vDir.y);
    vec3 dayBot = vec3(0.957, 0.906, 0.835);
    vec3 dayMid = vec3(0.80, 0.87, 0.90);
    vec3 dayTop = vec3(0.50, 0.70, 0.84);
    vec3 nBot = vec3(0.16, 0.19, 0.30);
    vec3 nMid = vec3(0.07, 0.10, 0.20);
    vec3 nTop = vec3(0.02, 0.03, 0.09);
    vec3 day = mix(mix(dayBot, dayMid, smoothstep(0.0, 0.35, h)), dayTop, smoothstep(0.35, 1.0, h));
    vec3 nig = mix(mix(nBot, nMid, smoothstep(0.0, 0.35, h)), nTop, smoothstep(0.35, 1.0, h));
    // a whisper of saffron at the horizon as the light turns
    float dusk = uNight * (1.0 - uNight) * 4.0;
    vec3 c = mix(day, nig, uNight) + vec3(0.85, 0.42, 0.15) * dusk * (1.0 - h) * 0.45;
    gl_FragColor = vec4(c, 1.0);
  }
`

export const DAY_FOG = new THREE.Color('#ece3d2')
export const NIGHT_FOG = new THREE.Color('#1d2436')

export function SkyDome() {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, uniforms: { uNight: { value: 0 } } }),
    [],
  )
  const ref = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  useFrame(() => {
    mat.uniforms.uNight.value = world.night
    ref.current?.position.copy(camera.position)
  })
  return (
    <mesh ref={ref} material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[180, 32, 16]} />
    </mesh>
  )
}

export function Stars() {
  const geo = useMemo(() => {
    const rnd = mulberry32(99)
    const n = 1600
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(1 - rnd() * 0.9)
      const r = 150
      pos.set([Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r + 6, Math.sin(ph) * Math.sin(th) * r], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  const ref = useRef<THREE.Points>(null)
  const mat = useRef<THREE.PointsMaterial>(null)
  const { camera } = useThree()
  useFrame(() => {
    if (!ref.current || !mat.current) return
    ref.current.visible = world.night > 0.02
    mat.current.opacity = Math.pow(world.night, 1.5) * (0.85 + Math.sin(now() * 1.3) * 0.08)
    ref.current.position.copy(camera.position)
    ref.current.rotation.y = now() * 0.004
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false} renderOrder={-9}>
      <pointsMaterial ref={mat} color="#fff8e8" size={1.3} sizeAttenuation transparent depthWrite={false} fog={false} />
    </points>
  )
}

/** Sun by day, moon by night — glowing sprites placed relative to the camera. */
export function Celestial() {
  const tex = getGlowTexture()
  const sun = useRef<THREE.Group>(null)
  const moon = useRef<THREE.Group>(null)
  const sunMat = useRef<THREE.SpriteMaterial>(null)
  const moonMat = useRef<THREE.SpriteMaterial>(null)
  const moonDisc = useRef<THREE.MeshBasicMaterial>(null)
  const { camera } = useThree()
  useFrame(() => {
    const n = world.night
    sun.current?.position.set(camera.position.x + 60, camera.position.y + 48 - n * 30, camera.position.z - 130)
    moon.current?.position.set(camera.position.x - 52, camera.position.y + 40 - (1 - n) * 25, camera.position.z - 130)
    if (sunMat.current) sunMat.current.opacity = 1 - n
    if (moonMat.current) moonMat.current.opacity = n * 0.7
    if (moonDisc.current) moonDisc.current.opacity = n
  })
  return (
    <>
      <group ref={sun}>
        <sprite scale={[46, 46, 1]} renderOrder={-8}>
          <spriteMaterial ref={sunMat} map={tex} color="#fff0cf" transparent depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
      <group ref={moon}>
        <sprite scale={[30, 30, 1]} renderOrder={-8}>
          <spriteMaterial ref={moonMat} map={tex} color="#c9d6ff" transparent depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <mesh renderOrder={-7}>
          <circleGeometry args={[4.2, 32]} />
          <meshBasicMaterial ref={moonDisc} color="#f6f1df" transparent depthWrite={false} fog={false} />
        </mesh>
      </group>
    </>
  )
}

const SPEED = 8.5
const LIFE = 4.2

/** Night-only shooting star. Catch it for the "Nightfall in Kullan" adventure. */
export function ShootingStar() {
  const nightOn = useStore((s) => s.night)
  const tex = getGlowTexture()
  const { camera } = useThree()
  const group = useRef<THREE.Group>(null)
  const head = useRef<THREE.Sprite>(null)
  const headMat = useRef<THREE.SpriteMaterial>(null)
  const trailMat = useRef<THREE.MeshBasicMaterial>(null)
  const s = useRef({ active: false, t0: 0, next: Infinity, caught: -1, start: new THREE.Vector3(), dir: new THREE.Vector3(), pos: new THREE.Vector3() })
  const trail = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.015, 0.16, 7, 8, 1, true)
    g.rotateZ(Math.PI / 2)
    g.translate(-3.5, 0, 0)
    return g
  }, [])
  const xAxis = useMemo(() => new THREE.Vector3(1, 0, 0), [])

  const { size } = useThree()
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as Record<string, unknown>).__starScreen = () => {
      const st = s.current
      if (!st.active || st.caught > 0) return null
      const v = st.pos.clone().project(camera)
      return { x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height }
    }
  }, [camera, size])

  useEffect(() => {
    s.current.next = nightOn ? now() + 2.4 : Infinity
    if (!nightOn) s.current.active = false
  }, [nightOn])

  useFrame(() => {
    const st = s.current
    const g = group.current
    if (!g) return
    const t = now()
    if (!nightOn || world.night < 0.5) {
      g.visible = false
      return
    }
    if (!st.active && t > st.next) {
      const r = Math.random()
      st.start.set(-17 - r * 5, 9 + Math.random() * 3, -44).applyMatrix4(camera.matrixWorld)
      st.dir.set(1, -0.22 - Math.random() * 0.1, 0.05).normalize().transformDirection(camera.matrixWorld)
      st.active = true
      st.caught = -1
      st.t0 = t
      audio.whoosh(0.05)
    }
    if (!st.active) {
      g.visible = false
      return
    }
    const k = t - st.t0
    if (st.caught > 0) {
      const c = (t - st.caught) / 0.8
      if (c > 1) {
        st.active = false
        st.next = t + 7 + Math.random() * 5
        g.visible = false
        return
      }
      head.current?.scale.setScalar(3 + c * 14)
      if (headMat.current) headMat.current.opacity = 1 - c
      if (trailMat.current) trailMat.current.opacity = 0
      return
    }
    if (k > LIFE) {
      st.active = false
      st.next = t + 6 + Math.random() * 5
      g.visible = false
      return
    }
    g.visible = true
    st.pos.copy(st.start).addScaledVector(st.dir, k * SPEED)
    g.position.copy(st.pos)
    g.quaternion.setFromUnitVectors(xAxis, st.dir)
    const fade = Math.min(1, k * 3) * Math.min(1, (LIFE - k) * 2)
    head.current?.scale.setScalar(3.2 + Math.sin(t * 20) * 0.3)
    if (headMat.current) headMat.current.opacity = fade
    if (trailMat.current) trailMat.current.opacity = fade * 0.85
  })

  const catchIt = () => {
    const st = s.current
    if (!st.active || st.caught > 0) return
    st.caught = now()
    audio.sparkle()
    actions.discover('star')
  }

  return (
    <group ref={group} visible={false}>
      <mesh geometry={trail} renderOrder={20}>
        <meshBasicMaterial ref={trailMat} color="#fff3d6" transparent depthTest={false} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <sprite ref={head} renderOrder={21}>
        <spriteMaterial ref={headMat} map={tex} color="#fffaf0" transparent depthTest={false} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          catchIt()
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <sphereGeometry args={[2.6, 10, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  )
}
