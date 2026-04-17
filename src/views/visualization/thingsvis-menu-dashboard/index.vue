<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import { getThingsVisDashboard, type ThingsVisDashboard } from '@/service/api/thingsvis'
import { useRouterPush } from '@/hooks/common/router'
import ThingsVisAppFrame from '@/components/thingsvis/ThingsVisAppFrame.vue'

const route = useRoute()
const { routerPushByKey } = useRouterPush()

const dashboardSchema = ref<ThingsVisDashboard | null>(null)
const dashboardTitle = ref('')

const dashboardId = computed(() => {
  const paramValue = route.params.dashboardId
  if (typeof paramValue === 'string' && paramValue.trim()) {
    return paramValue.trim()
  }

  const queryValue = route.query.id
  if (typeof queryValue === 'string' && queryValue.trim()) {
    return queryValue.trim()
  }

  const segments = route.path.split('/').filter(Boolean)
  return segments.at(-1) || ''
})

async function loadDashboard() {
  if (!dashboardId.value) {
    dashboardSchema.value = null
    dashboardTitle.value = ''
    return
  }

  try {
    const { data } = await getThingsVisDashboard(dashboardId.value)
    dashboardSchema.value = data
    dashboardTitle.value = data?.name || ''
  } catch (error) {
    console.warn('加载菜单仪表盘失败', error)
    dashboardSchema.value = null
    dashboardTitle.value = ''
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
  <div class="h-full w-full flex flex-col bg-[var(--layout-content-bg)]">
    <div class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 h-12">
      <NBreadcrumb>
        <NBreadcrumbItem class="cursor-pointer" @click="routerPushByKey('home')">首页</NBreadcrumbItem>
        <NBreadcrumbItem>
          {{ dashboardTitle || '仪表盘' }}
        </NBreadcrumbItem>
      </NBreadcrumb>

      <NButton text @click="routerPushByKey('home')">返回首页</NButton>
    </div>

    <div class="flex-1 overflow-hidden bg-white">
      <ThingsVisAppFrame
        v-if="dashboardId"
        :id="dashboardId"
        :schema="dashboardSchema"
        mode="viewer"
        class="h-full w-full"
      />
    </div>
  </div>
</template>
