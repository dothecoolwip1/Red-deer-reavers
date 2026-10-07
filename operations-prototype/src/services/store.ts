// Tiny in-memory store standing in for "the backend". Real services (Supabase etc.)
// can later replace the functions in services/*.ts without touching pages.
import { useSyncExternalStore } from 'react'
import { seed, type Seed, type CollectionKey } from '../data'
import type { RoleId } from '../types'

type Session = { role: RoleId; toast: string }
let state: Seed = structuredClone(seed)
let session: Session = { role: 'Administrator', toast: '' }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export const getState = () => state
export function useColl<K extends CollectionKey>(key: K): Seed[K] {
  return useSyncExternalStore(subscribe, () => state[key])
}
export function useAgmState() { return useSyncExternalStore(subscribe, () => state.agm) }
export function useSession() { return useSyncExternalStore(subscribe, () => session) }

export const uid = (p = 'n') => p + Math.random().toString(36).slice(2, 8)

export function addItem<K extends CollectionKey>(key: K, item: any, front = true) {
  const arr = state[key] as any[]
  state = { ...state, [key]: front ? [item, ...arr] : [...arr, item] }
  emit()
}
export function patchItem<K extends CollectionKey>(key: K, id: string, patch: Partial<Seed[K][number]> | ((x: Seed[K][number]) => Partial<Seed[K][number]>)) {
  state = { ...state, [key]: (state[key] as any[]).map(x => x.id === id ? { ...x, ...(typeof patch === 'function' ? (patch as any)(x) : patch) } : x) }
  emit()
}
export function removeItem<K extends CollectionKey>(key: K, id: string) {
  state = { ...state, [key]: (state[key] as any[]).filter(x => x.id !== id) }
  emit()
}
export function patchAgm(fn: (a: Seed['agm']) => Seed['agm']) { state = { ...state, agm: fn(state.agm) }; emit() }
export function setRole(role: RoleId) { session = { ...session, role }; emit() }
let toastTimer: any
export function toast(msg: string) {
  session = { ...session, toast: msg }; emit()
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { session = { ...session, toast: '' }; emit() }, 3500)
}
export function resetMockData() { state = structuredClone(seed); toast('Mock data reset'); emit() }
