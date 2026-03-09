<template>
  <div class="thingsvis-frame-container">
    <iframe v-if="url && token" :src="url" class="thingsvis-frame" frameborder="0" allowfullscreen></iframe>
    <div v-else class="loading-placeholder">正在连接可视化引擎...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getThingsVisToken } from '@/utils/thingsvis'

const props = defineProps<{
  id: string
  mode?: string
}>()

const token = ref('')
const url = ref('')

/** Strip any hash fragment and return the bare Studio HTML base URL. */
function getStudioBase(): string {
  const raw = (import.meta.env.VITE_THINGSVIS_STUDIO_URL as string) || 'http://localhost:3000/main'
  const hashIdx = raw.indexOf('#')
  return hashIdx !== -1 ? raw.substring(0, hashIdx) : raw
}

const handleMessage = async (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return

  const { type, projectId } = event.data

  if (type === 'tv:preview') {
    if (!token.value) return
    const previewUrl = `${getStudioBase()}#/preview?projectId=${projectId || props.id}&token=${token.value}&mode=embedded`
    window.open(previewUrl, '_blank')
  }

  if (type === 'tv:publish') {
    try {
      const { publishThingsVisDashboard } = await import('@/service/api/thingsvis')
      const res = await publishThingsVisDashboard(projectId || props.id)

      if (res.data) {
        if ((window as any).$message) {
          ;(window as any).$message.success('发布成功')
        } else {
          alert('发布成功')
        }
      } else {
        console.error('[AppFrame] Publish failed:', res.error)
        if ((window as any).$message) {
          ;(window as any).$message.error(`发布失败: ${res.error?.message || '未知错误'}`)
        }
      }
    } catch (e) {
      console.error('[AppFrame] Publish exception:', e)
    }
  }
}

onMounted(async () => {
  window.addEventListener('message', handleMessage)

  try {
    const tokenStr = await getThingsVisToken()
    if (tokenStr) {
      token.value = tokenStr
      url.value = `${getStudioBase()}#/editor/${props.id}?mode=embedded&token=${tokenStr}`
    } else {
      console.warn('[AppFrame] Token acquisition returned null')
    }
  } catch (error) {
    console.error('[AppFrame] Failed to acquire ThingsVis token:', error)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<style scoped>
.thingsvis-frame-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #1a1a1a;
}

.thingsvis-frame {
  width: 100%;
  height: 100%;
  display: block;
}

.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
}
</style>
