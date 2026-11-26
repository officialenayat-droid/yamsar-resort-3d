import { useSyncExternalStore } from 'react'
import { DEFAULT_CONFIG } from '../../shared/defaults.ts'
import type { CabinId, PublicConfig, StayConfig } from '../../shared/types.ts'

/**
 * Live resort config (rooms, rates, experiences, contact details) from the
 * booking server. Falls back to built-in defaults so the site always renders.
 */
interface ConfigState {
  config: PublicConfig
  status: 'loading' | 'live' | 'offline'
}

let state: ConfigState = { config: DEFAULT_CONFIG, status: 'loading' }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export async function loadConfig() {
  try {
    const res = await fetch('/api/config', { headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(String(res.status))
    const config = (await res.json()) as PublicConfig
    state = { config, status: 'live' }
  } catch {
    state = { ...state, status: 'offline' }
  }
  emit()
}

export function useConfig(): PublicConfig {
  return useSyncExternalStore(subscribe, () => state.config, () => state.config)
}
export function useConfigStatus() {
  return useSyncExternalStore(subscribe, () => state.status, () => state.status)
}
export function useStay(id: CabinId): StayConfig {
  const cfg = useConfig()
  return cfg.stays.find((s) => s.id === id) ?? DEFAULT_CONFIG.stays.find((s) => s.id === id)!
}
