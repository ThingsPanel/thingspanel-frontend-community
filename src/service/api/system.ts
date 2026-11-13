import { localStg } from '@/utils/storage'
import { createSystemClient } from './system-transport'

let maintenanceHook: (() => void) | undefined
export function setSystemMaintenanceHook(fn: (() => void) | undefined) {
  maintenanceHook = fn
}

export const systemApi = createSystemClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined,
  onMaintenance: () => maintenanceHook?.()
})

export * from './system-transport'
