<template>
  <div class="h-full w-full overflow-hidden">
    <iframe
      ref="iframeRef"
      :src="frameUrl"
      class="h-full w-full border-0"
      scrolling="no"
      allow="fullscreen; autoplay"
      allowfullscreen
      referrerpolicy="no-referrer"
      @load="refreshRuntimeData"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { buildThingsVisSharedFrameUrl } from '@/utils/thingsvis/share-url'

const props = defineProps<{
  id: string
  shareToken: string
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const studioBase = (import.meta.env.VITE_THINGSVIS_STUDIO_URL as string) || 'http://localhost:3000/main'
const frameUrl = computed(() =>
  buildThingsVisSharedFrameUrl({
    studioBase,
    dashboardId: props.id,
    shareToken: props.shareToken
  })
)

function getTargetOrigin(): string {
  try {
    return new URL(studioBase, window.location.href).origin
  } catch {
    return window.location.origin
  }
}

async function refreshRuntimeData() {
  try {
    const params = new URLSearchParams({
      dashboard_id: props.id,
      share_token: props.shareToken
    })
    const response = await fetch(`/api/v1/thingsvis/share/runtime?${params.toString()}`)
    if (!response.ok) return
    const payload = await response.json()
    const devices = payload?.data?.devices
    if (!Array.isArray(devices) || !iframeRef.value?.contentWindow) return

    devices.forEach((device: any) => {
      if (!device?.fields || typeof device.fields !== 'object') return
      iframeRef.value?.contentWindow?.postMessage(
        {
          type: 'tv:platform-data',
          payload: {
            dataSourceId: device.dataSourceId,
            deviceId: device.deviceId,
            fields: device.fields
          }
        },
        getTargetOrigin()
      )
    })
  } catch {
    // The shared canvas remains usable with its configured fallback values.
  }
}

onMounted(() => {
  refreshTimer = setInterval(() => {
    void refreshRuntimeData()
  }, 5000)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>
