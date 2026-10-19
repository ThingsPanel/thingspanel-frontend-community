import { computed, ref, watch, type ComputedRef } from 'vue'
import type { DeviceConfigNativeBinding } from '../../service/api/native-template-binding'
import type { PlatformField } from '../../utils/thingsvis/types'
import {
  decorateNativeAttributeRows,
  decorateNativeEventRows,
  hasNativeDeviceBinding
} from './native-device-model-contract'

type NativeMetadataKind = 'attribute' | 'event'
type NativeModelResolver = (
  _binding: DeviceConfigNativeBinding | null | undefined
) => Promise<{ platformFields: PlatformField[] } | null>

/** Resolve current binding metadata and decorate rows only from its pinned model snapshot. */
export function useNativeDeviceMetadata(
  binding: ComputedRef<DeviceConfigNativeBinding | null | undefined>,
  kind: NativeMetadataKind,
  resolveModel: NativeModelResolver
) {
  const nativeFields = ref<PlatformField[]>([])
  const nativeMetadataFailed = ref(false)
  const isNativeBound = computed(() => hasNativeDeviceBinding(binding.value))
  let requestId = 0

  watch(
    binding,
    async currentBinding => {
      const currentRequestId = ++requestId
      nativeFields.value = []
      nativeMetadataFailed.value = false
      if (!hasNativeDeviceBinding(currentBinding)) return
      try {
        const resolved = await resolveModel(currentBinding)
        if (currentRequestId !== requestId) return
        nativeFields.value = (resolved?.platformFields || []).filter(field => field.dataType === kind)
      } catch (error) {
        if (currentRequestId !== requestId) return
        nativeMetadataFailed.value = true
        console.warn(
          `[Device${kind === 'attribute' ? 'Stats' : 'EventReport'}] Failed to read pinned native model metadata`,
          error
        )
      }
    },
    { immediate: true, deep: true }
  )

  const decorateRows = computed(() => {
    if (!isNativeBound.value) return undefined
    // Capture the ref value here so late snapshot resolution invalidates this
    // computed decorator and refetches/redecorates the raw device rows.
    const pinnedFields = nativeFields.value
    return (rows: Record<string, any>[]) =>
      kind === 'attribute'
        ? decorateNativeAttributeRows(rows, pinnedFields)
        : decorateNativeEventRows(rows, pinnedFields)
  })

  return { isNativeBound, nativeFields, nativeMetadataFailed, decorateRows }
}
