import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from './world'

// ───────────────────────── Sindh River path ─────────────────────────
export const RIVER_WIDTH = 2.6
const RIVER_POINTS: [number, number][] = [
  [-3.5, -15],
  [-1.2, -11],
  [2, -7.5],
  [-1.2, -2.5],
  [2.4, 3.5],
  [0.2, 9.5],
  [-2.2, 15],
  [-0.8, 21],
  [1.5, 28],
]
export const riverCurve = new THREE.CatmullRomCurve3(
  RIVER_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  'catmullrom',
  0.5,
)
export const RIVER_SAMPLES = 260
export const riverPts = riverCurve.getSpacedPoints(RIVER_SAMPLES)
export const riverTangents = riverPts.map((_, i) => riverCurve.getTangentAt(i / RIVER_SAMPLES))

export function nearestRiverIndex(x: number, z: number) {
  let best = 0
  let bd = Infinity
  for (let i = 0; i < riverPts.length; i++) {
    const dx = riverPts[i].x - x
    const dz = riverPts[i].z - z
    const d = dx * dx + dz * dz
    if (d < bd) {
      bd = d
      best = i
    }
  }
  return best
}
export function distToRiver(x: number, z: number) {
  const p = riverPts[nearestRiverIndex(x, z)]
  return Math.hypot(p.x - x, p.z - z)
}

// ───────────────────────── terrain ─────────────────────────
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/** Base valley height before the river channel is carved. */
function valleyHeight(x: number, z: number) {
  let h = 0.35
  h += 0.22 * Math.sin(x * 0.33 + 1.3) * Math.cos(z * 0.29)
  h += 0.12 * Math.sin(x * 0.81 + z * 0.67)
  h += 0.06 * Math.sin(x * 2.1 - z * 1.7)
  const side = Math.max(0, Math.abs(x) - 10)
  h += 0.02 * Math.pow(side, 1.6)
  const back = Math.max(0, -z - 9)
  h += 0.006 * back * back
  return h
}

export function groundHeight(x: number, z: number) {
  const h = valleyHeight(x, z)
  const d = distToRiver(x, z)
  const carve = smoothstep(RIVER_WIDTH / 2 + 0.4, RIVER_WIDTH / 2 - 0.7, d)
  return h * (1 - carve) + -0.42 * carve
}

const C = (hex: string) => new THREE.Color(hex)

export function makeGround(): THREE.BufferGeometry {
  const plane = new THREE.PlaneGeometry(96, 76, 96, 76)
  plane.rotateX(-Math.PI / 2)
  plane.translate(0, 0, 4)
  const pos = plane.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, groundHeight(x, z))
  }
  const geo = plane.toNonIndexed()
  const p = geo.attributes.position
  const colors = new Float32Array(p.count * 3)
  const rnd = mulberry32(7)
  const meadow = [C('#86a35c'), C('#7a9852'), C('#90ad66'), C('#6f8d4c')]
  const flowers = [C('#e9cf63'), C('#d98aa3'), C('#f1ece0'), C('#b9a3df')]
  const bank = [C('#b9ab8d'), C('#a99c80'), C('#c8bca0')]
  const bed = [C('#56655c'), C('#4b5a52'), C('#627064')]
  const high = [C('#5d7a4d'), C('#536f45'), C('#6a855a')]
  const c = new THREE.Color()
  for (let f = 0; f < p.count; f += 3) {
    const cx = (p.getX(f) + p.getX(f + 1) + p.getX(f + 2)) / 3
    const cy = (p.getY(f) + p.getY(f + 1) + p.getY(f + 2)) / 3
    const cz = (p.getZ(f) + p.getZ(f + 1) + p.getZ(f + 2)) / 3
    const d = distToRiver(cx, cz)
    const r = rnd()
    if (d < RIVER_WIDTH / 2 - 0.2) c.copy(bed[Math.floor(r * 3)])
    else if (d < RIVER_WIDTH / 2 + 0.7) c.copy(bank[Math.floor(r * 3)])
    else if (cy > 2.2) c.copy(high[Math.floor(r * 3)]).lerp(C('#8c9590'), Math.min(1, (cy - 2.2) / 6))
    else if (r > 0.965) c.copy(flowers[Math.floor(rnd() * 4)])
    else c.copy(meadow[Math.floor(r * 4) % 4])
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (f + k) * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

// ───────────────────────── Himalayan peaks ─────────────────────────
function hash3(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}
const r3 = (v: number) => Math.round(v * 1000) / 1000

/** Faceted low-poly peak with height-banded vertex colours (moss → rock → snow). */
export function makePeak(radius: number, height: number, seed: number, snowLine = 0.56) {
  const cone = new THREE.ConeGeometry(radius, height, 12, 8, true)
  cone.translate(0, height / 2, 0)
  const pos = cone.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const ny = v.y / height
    const n = hash3(r3(v.x) + seed, r3(v.y), r3(v.z))
    const ang = Math.atan2(v.z, v.x)
    const spur = Math.sin(ang * 3 + seed * 1.7) * 0.5 + 0.5
    const radial = 1 + (n - 0.5) * 0.5 * (1 - ny) + spur * 0.22 * (1 - ny) * ny * 2 - 0.08
    v.x *= radial
    v.z *= radial
    if (ny > 0.02 && ny < 0.98) v.y += (n - 0.5) * height * 0.07
    // lean the summit slightly for character
    v.x += ny * ny * radius * 0.12 * Math.sin(seed)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  const geo = cone.toNonIndexed()
  const p = geo.attributes.position
  const colors = new Float32Array(p.count * 3)
  const snow = C('#f8f9fb'), snowShade = C('#dde6ee'), rock = C('#6c7778'), rockDark = C('#4a5554'), moss = C('#55704b'), blueRock = C('#7d8b96')
  const c = new THREE.Color()
  for (let f = 0; f < p.count; f += 3) {
    const cy = (p.getY(f) + p.getY(f + 1) + p.getY(f + 2)) / 3
    const cx = (p.getX(f) + p.getX(f + 1) + p.getX(f + 2)) / 3
    const ny = cy / height
    const n = hash3(r3(cx) + seed, r3(cy), f)
    if (ny > snowLine + (n - 0.5) * 0.22) c.copy(n > 0.45 ? snow : snowShade)
    else if (ny < 0.16) c.copy(moss).lerp(rockDark, n * 0.6)
    else c.copy(n > 0.66 ? blueRock : n > 0.33 ? rock : rockDark)
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (f + k) * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

export interface PeakSpec {
  x: number
  z: number
  r: number
  h: number
  seed: number
  snow: number
  delay: number
  label?: string
}

export function peakLayout(): PeakSpec[] {
  const rnd = mulberry32(42)
  const peaks: PeakSpec[] = []
  // Back range: Thajiwas & the great white wall
  for (let i = 0; i < 10; i++) {
    const x = -36 + i * 8 + (rnd() - 0.5) * 3
    const center = 1 - Math.min(1, Math.abs(x + 6) / 30)
    peaks.push({ x: x * 1.25, z: -34 + (rnd() - 0.5) * 5, r: 8 + rnd() * 3, h: 9 + center * 6 + rnd() * 2.5, seed: i * 3.1, snow: 0.42, delay: 0.02 * i })
  }
  // Mid ridges (Zoji La side to the east)
  for (let i = 0; i < 9; i++) {
    const x = -30 + i * 7.5 + (rnd() - 0.5) * 3
    if (Math.abs(x + 3) < 4.5) continue // leave the river gorge open
    peaks.push({ x, z: -20 + (rnd() - 0.5) * 3, r: 4.5 + rnd() * 2, h: 4.5 + rnd() * 3, seed: 50 + i, snow: 0.52, delay: 0.25 + 0.03 * i })
  }
  // Flanking foothills
  for (let i = 0; i < 6; i++) {
    const side = i % 2 === 0 ? -1 : 1
    const x = side * (19 + rnd() * 5)
    peaks.push({ x, z: -8 + Math.floor(i / 2) * 8 + rnd() * 2, r: 4 + rnd() * 2, h: 2.8 + rnd() * 1.8, seed: 90 + i, snow: 0.8, delay: 0.42 + 0.04 * i })
  }
  // label the stars of the skyline
  const tallest = peaks.slice(0, 10).filter((p) => Math.abs(p.x) < 16).reduce((a, b) => (b.h > a.h ? b : a))
  tallest.label = 'Thajiwas Glacier'
  const east = peaks.filter((p) => p.x > 8 && p.x < 22 && p.z < -12 && p.z > -26).sort((a, b) => b.h - a.h)[0]
  if (east) east.label = 'Zoji La Ridge'
  return peaks
}

// ───────────────────────── deodar pine ─────────────────────────
function colorize(geo: THREE.BufferGeometry, fn: (y: number, i: number) => THREE.Color) {
  const g = geo.index ? geo.toNonIndexed() : geo
  const p = g.attributes.position
  const colors = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const c = fn(p.getY(i), i)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return g
}

/** Layered deodar (Himalayan cedar): drooping tiers with snow-dusted tips. */
export function makeDeodar(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  const trunk = new THREE.CylinderGeometry(0.07, 0.13, 0.8, 6)
  trunk.translate(0, 0.4, 0)
  parts.push(colorize(trunk, () => C('#5b3b2b')))
  const tiers: [number, number, number][] = [
    [1.0, 0.8, 0.5],
    [0.84, 0.74, 0.92],
    [0.66, 0.66, 1.33],
    [0.48, 0.6, 1.7],
    [0.3, 0.55, 2.04],
    [0.14, 0.42, 2.36],
  ]
  const greens = [C('#1f3d31'), C('#25473a'), C('#2c5140'), C('#1c352d')]
  const frost = C('#e8eee9')
  tiers.forEach(([r, h, y], k) => {
    const cone = new THREE.ConeGeometry(r, h, 8, 1)
    cone.rotateY(k * 0.7)
    cone.translate(0, y + h / 2, 0)
    const top = y + h
    parts.push(
      colorize(cone, (vy) => {
        const g = greens[k % greens.length].clone()
        return vy > top - 0.01 ? g.lerp(frost, 0.75) : g
      }),
    )
  })
  const merged = mergeGeometries(parts)!
  merged.computeVertexNormals()
  return merged
}

// ───────────────────────── shared helpers ─────────────────────────
/** Triangular prism (A-frame / gable roof). Base on y=0, centred on z. */
export function makePrism(w: number, h: number, d: number) {
  const s = new THREE.Shape()
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(0, h)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false })
  g.translate(0, 0, -d / 2)
  return g
}

export function makeTriangle(w: number, h: number) {
  const s = new THREE.Shape()
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(0, h)
  s.closePath()
  return new THREE.ShapeGeometry(s)
}

let glowTex: THREE.Texture | null = null
/** Soft radial glow sprite texture, generated on a canvas. */
export function getGlowTexture() {
  if (glowTex) return glowTex
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const ctx = cv.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.2, 'rgba(255,245,220,0.85)')
  g.addColorStop(0.5, 'rgba(255,220,170,0.25)')
  g.addColorStop(1, 'rgba(255,200,150,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  glowTex = new THREE.CanvasTexture(cv)
  glowTex.colorSpace = THREE.SRGBColorSpace
  return glowTex
}
