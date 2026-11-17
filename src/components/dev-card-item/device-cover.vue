<script setup lang="ts">
import { ref, watch } from 'vue'
import { fileAssetsNative } from '@/service/api/file-assets-native'

const props = defineProps<{ assetId?: string | null; name?: string }>()
const url = ref('')
watch(
  () => props.assetId,
  async (assetId, _old, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
    })
    url.value = ''
    if (!assetId) return
    try {
      const { asset } = await fileAssetsNative.get(assetId)
      if (active) url.value = asset.downloadUrl || ''
    } catch {
      // Unavailable covers must not prevent device browsing.
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="device-cover">
    <img v-if="url" :src="url" :alt="name || ''" @error="url = ''" />
    <SvgIcon v-else local-icon="defaultdevice" class="device-cover-fallback" aria-hidden="true" />
  </div>
</template>

<style scoped>
.device-cover {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
}
.device-cover img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.device-cover-fallback {
  width: 40px;
  height: 40px;
  opacity: 0.7;
}
</style>
