import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { SystemApiError, setSystemMaintenanceHook, systemApi } from '@/service/api/system'
import type { SystemOperation } from '@/service/api/system'
import {
  classifyMaintenance,
  createMaintenancePoller,
  type MaintenanceOutcome,
  type MaintenanceStatus
} from '@/utils/system-maintenance'
import { useAuthStore } from './auth'

/** Super-admin system management: availability probe + maintenance overlay state. */
export const useSystemManageStore = defineStore('system-manage', () => {
  /** null = not probed yet; false = no system manager (hide everything). */
  const available = ref<boolean | null>(null)
  const maintenance = ref(false)
  const status = ref<MaintenanceStatus | undefined>()
  const unreachable = ref(false)
  /** True from "operation accepted" until it ends; lets a network error mean "maintenance". */
  const operationRunning = ref(false)
  let expectedId: string | undefined

  const outcome = computed<MaintenanceOutcome>(() => classifyMaintenance(status.value))

  const poller = createMaintenancePoller({
    fetch: (input, init) => globalThis.fetch(input, init),
    onStatus(doc) {
      if (expectedId && doc.id && doc.id !== expectedId) return // stale document of an older operation
      status.value = doc
      unreachable.value = false
      const result = classifyMaintenance(doc)
      if (result !== 'running') operationRunning.value = false
      if (result === 'done') window.setTimeout(() => window.location.reload(), 1000)
    },
    onUnreachable() {
      unreachable.value = true
    }
  })

  const isSuperAdmin = () => useAuthStore().userInfo?.authority === 'SYS_ADMIN'

  /** Probe once; any failure (503 unavailable, 403, network) hides the feature. */
  async function probe() {
    if (!isSuperAdmin()) {
      available.value = false
      return
    }
    if (available.value !== null) return
    try {
      const s = await systemApi.status()
      available.value = true
      if (s.operation?.state === 'running') enterMaintenance(s.operation.id)
    } catch (error) {
      available.value = error instanceof SystemApiError && error.maintenance ? true : false
    }
  }

  function enterMaintenance(operationId?: string) {
    if (operationId) expectedId = operationId
    operationRunning.value = true
    if (maintenance.value) return
    maintenance.value = true
    status.value = undefined
    poller.start()
  }

  /** Called with the `operation` returned by restart / upgrade / backup / restore. */
  function startOperation(operation: SystemOperation) {
    enterMaintenance(operation.id)
  }

  /** Network error while an operation is running means nginx/agent is bouncing. */
  function noteNetworkError() {
    if (operationRunning.value) enterMaintenance()
  }

  function leaveMaintenance() {
    poller.stop()
    maintenance.value = false
    operationRunning.value = false
    expectedId = undefined
    status.value = undefined
  }

  setSystemMaintenanceHook(() => enterMaintenance())

  return {
    available,
    maintenance,
    status,
    unreachable,
    operationRunning,
    outcome,
    probe,
    startOperation,
    enterMaintenance,
    noteNetworkError,
    leaveMaintenance
  }
})
