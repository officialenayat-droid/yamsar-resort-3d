import { useSyncExternalStore } from 'react'
import { audio } from '../audio/AudioEngine'
import { world, now } from '../three/world'
import { ADVENTURES, type AdventureId, type CabinId, type CameraPreset } from '../data'

export interface State {
  entered: boolean
  soundOn: boolean
  volume: number
  night: boolean
  camera: CameraPreset
  found: Record<AdventureId, boolean>
  lit: Record<CabinId, boolean>
  toast: { id: number; title: string; body?: string } | null
  cutaway: CabinId | null
  booking: { open: boolean; cabin: CabinId }
  postcardOpen: boolean
  trackerOpen: boolean
}

let state: State = {
  entered: false,
  soundOn: false,
  volume: 0.7,
  night: false,
  camera: 'overview',
  found: { bukhari: false, deodar: false, star: false, kahwa: false },
  lit: { aframe: false, riverfront: false, glacier: false },
  toast: null,
  cutaway: null,
  booking: { open: false, cabin: 'aframe' },
  postcardOpen: false,
  trackerOpen: false,
}

const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const getState = () => state
export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...p }
  listeners.forEach((l) => l())
}
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state))
}

let toastTimer: number | undefined
let popAt = 0

export const actions = {
  enter(withSound: boolean) {
    if (withSound) audio.init()
    setState({ entered: true, soundOn: withSound })
    window.setTimeout(() => actions.pop(), 450)
  },
  pop() {
    if (now() - popAt < 0.8) return
    popAt = now()
    world.popStart = now()
    audio.popReveal()
  },
  setNight(n: boolean) {
    world.nightTarget = n ? 1 : 0
    audio.setNight(n)
    setState({ night: n })
    if (n && !state.found.star) actions.toast('Nightfall in Kullan', 'Watch the sky above the peaks. A shooting star is coming. Click it!')
  },
  setCamera(c: CameraPreset) {
    setState({ camera: c })
  },
  toggleSound() {
    if (!state.soundOn) {
      audio.init()
      audio.setMuted(false)
      audio.setNight(state.night)
      setState({ soundOn: true })
    } else {
      audio.setMuted(true)
      setState({ soundOn: false })
    }
  },
  setVolume(v: number) {
    audio.setVolume(v)
    setState({ volume: v })
  },
  toast(title: string, body?: string) {
    window.clearTimeout(toastTimer)
    setState({ toast: { id: Date.now(), title, body } })
    toastTimer = window.setTimeout(() => setState({ toast: null }), 4200)
  },
  discover(id: AdventureId) {
    if (state.found[id]) return
    const found = { ...state.found, [id]: true }
    setState({ found })
    audio.discover()
    const count = Object.values(found).filter(Boolean).length
    const adv = ADVENTURES.find((a) => a.id === id)!
    actions.toast(`Discovered: ${adv.title}`, count === 4 ? 'All four found! Your Sonamarg keepsake postcard is ready.' : `${count} of 4 little adventures found`)
    if (count === 4) window.setTimeout(() => setState({ postcardOpen: true }), 1800)
  },
  openCutaway(id: CabinId) {
    setState({ cutaway: id })
    audio.paper()
  },
  closeCutaway() {
    setState({ cutaway: null })
    audio.setFireLevel(Object.values(state.lit).some(Boolean) ? 0.25 : 0)
  },
  lightBukhari(id: CabinId) {
    if (state.lit[id]) return
    setState((s) => ({ lit: { ...s.lit, [id]: true } }))
    audio.ignite()
    audio.setFireLevel(1)
    window.setTimeout(() => actions.discover('bukhari'), 900)
  },
  openBooking(cabin?: CabinId) {
    setState((s) => ({ booking: { open: true, cabin: cabin ?? s.booking.cabin }, cutaway: null }))
    audio.paper()
  },
  closeBooking() {
    setState((s) => ({ booking: { ...s.booking, open: false } }))
  },
  setPostcard(open: boolean) {
    setState({ postcardOpen: open })
    if (open) audio.paper()
  },
  setTracker(open: boolean) {
    setState({ trackerOpen: open })
  },
}
