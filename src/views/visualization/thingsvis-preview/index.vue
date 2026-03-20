<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ThingsVisAppFrame from '@/components/thingsvis/ThingsVisAppFrame.vue'
import { getThingsVisDashboard, type ThingsVisDashboard } from '@/service/api/thingsvis'

const route = useRoute()

const dashboardSchema = ref<ThingsVisDashboard | null>(null)

const dashboardId = computed(() => {
  const queryValue = route.query.id
  if (typeof queryValue === 'string' && queryValue.trim()) {
    return queryValue.trim()
  }

  const paramValue = route.params.dashboardId
  if (typeof paramValue === 'string' && paramValue.trim()) {
    return paramValue.trim()
  }

  return ''
})

async function loadDashboard() {
  if (!dashboardId.value) {
    dashboardSchema.value = null
    return
  }

  try {
    const { data } = await getThingsVisDashboard(dashboardId.value)
    dashboardSchema.value = data
    document.title = `${data?.name || '仪表盘'} - 浏览`
  } catch (error) {
    console.warn('加载预览仪表盘失败', error)
    dashboardSchema.value = null
  }
}

watch(
  dashboardId,
  () => {
    void loadDashboard()
  },
  { immediate: true }
)
</script>

<template>
  <div class="h-full w-full bg-white">
    <div v-if="dashboardId" class="h-full w-full overflow-hidden bg-white">
      <ThingsVisAppFrame :id="dashboardId" :schema="dashboardSchema" mode="viewer" class="h-full w-full" />
    </div>
    <div v-else class="flex h-full items-center justify-center text-gray-400">
      <div class="text-center">
        <p class="text-lg">无法加载仪表盘</p>
        <p class="text-sm mt-2 opacity-70">ID: {{ dashboardId }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 确保容器占满全屏 */
:global(body),
:global(#app) {
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
