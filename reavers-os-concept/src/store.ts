import { useSyncExternalStore } from 'react'
import { seed, type Seed } from './data'
export type PersonaId = 'alex' | 'brynn' | 'finn' | 'dmitri' | 'kira'
export interface Persona { id: PersonaId; memberId: string; name: string; role: string; blurb: string }
export const personas: Persona[] = [
  { id: 'alex', memberId: 'm1', name: 'Alex Hartwell', role: 'President', blurb: 'Sees everything. Approves posts, signs off on asks.' },
  { id: 'brynn', memberId: 'm2', name: 'Brynn Okafor', role: 'Treasurer', blurb: 'Money inbox, budget, grant reporting.' },
  { id: 'finn', memberId: 'm6', name: 'Finn Gallagher', role: 'Comms lead', blurb: 'Stories, posts, media, sponsor exposure.' },
  { id: 'dmitri', memberId: 'm4', name: 'Dmitri Volkov', role: 'Head coach', blurb: 'Practices, check-ins, gear, safety.' },
  { id: 'kira', memberId: 'm11', name: 'Kira Novak', role: 'New member', blurb: 'Only her own stuff: dues, waiver, practices, AGM.' },
]
let state: Seed = structuredClone(seed)
let persona: PersonaId = 'alex'
let toastMsg = ''
const ls = new Set<() => void>(); const emit = () => ls.forEach(l => l())
const sub = (l: () => void) => { ls.add(l); return () => { ls.delete(l) } }
export const getState = () => state
export const useStore = () => useSyncExternalStore(sub, () => state)
export const usePersona = () => { const id = useSyncExternalStore(sub, () => persona); return personas.find(p => p.id === id)! }
export const useToast = () => useSyncExternalStore(sub, () => toastMsg)
export const setPersona = (p: PersonaId) => { persona = p; emit() }
let t: any
export const toast = (m: string) => { toastMsg = m; emit(); clearTimeout(t); t = setTimeout(() => { toastMsg = ''; emit() }, 3000) }
export const uid = (p = 'n') => p + Math.random().toString(36).slice(2, 8)
type Coll = { [K in keyof Seed]: Seed[K] extends any[] ? K : never }[keyof Seed]
export function add<K extends Coll>(k: K, item: any) { state = { ...state, [k]: [item, ...(state[k] as any[])] }; emit() }
export function patch<K extends Coll>(k: K, id: string, p: any) { state = { ...state, [k]: (state[k] as any[]).map(x => x.id === id ? { ...x, ...(typeof p === 'function' ? p(x) : p) } : x) }; emit() }
export const reset = () => { state = structuredClone(seed); toast('Mock data reset'); emit() }
export const TODAY = '2026-10-07'
