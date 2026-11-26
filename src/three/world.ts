/**
 * Mutable per-frame world values shared between the 3D scene and the DOM.
 * Kept outside React so useFrame loops can read/write without re-rendering.
 */
export const world = {
  /** 0 = day, 1 = night — eased toward nightTarget every frame */
  night: 0,
  nightTarget: 0,
  /** performance-time (s) when the pop-up reveal last started; -1 = not yet */
  popStart: -1,
  /** 0..1 hero scroll progress (drives the camera flight) */
  scroll: 0,
  /** normalised pointer position -1..1 */
  mouseX: 0,
  mouseY: 0,
  lowPower: false,
}

export const now = () => performance.now() / 1000

/**
 * Step response of an under-damped harmonic oscillator: 0 → overshoot → settle at 1.
 * The 3D analogue of cubic-bezier(0.34, 1.56, 0.64, 1).
 */
export function spring(t: number, zeta = 0.34, omega = 10.5) {
  if (t <= 0) return 0
  const wd = omega * Math.sqrt(1 - zeta * zeta)
  return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t))
}

/** Pop-up scale for an element that springs `delay` seconds after the reveal starts. */
export function popScale(delay: number, t = now()) {
  if (world.popStart < 0) return 0
  return Math.max(0, spring(t - world.popStart - delay))
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
