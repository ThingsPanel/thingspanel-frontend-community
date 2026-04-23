<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import { $t } from '@/locales'
import { useRouterPush } from '@/hooks/common/router'
import { getThingsVisDashboard, type ThingsVisDashboard } from '@/service/api/thingsvis'
import ThingsVisAppFrame from '@/components/thingsvis/ThingsVisAppFrame.vue'

const route = useRoute()
const { routerPushByKey } = useRouterPush()

const dashboardId = computed(() => String(route.query.id || '').trim())
const currentProjectId = computed(() => {
  const routeProjectId = String(route.query.projectId || '').trim()
  return routeProjectId || dashboardSchema.value?.projectId || ''
})
const projectTitle = ref('')
const dashboardSchema = ref<ThingsVisDashboard | null>(null)

/** 加载标题 (仅用于面包屑显示) */
const loadDashboardInfo = async () => {
  if (!dashboardId.value) {
    projectTitle.value = ''
    dashboardSchema.value = null
    return
  }

  try {
    let result = await getThingsVisDashboard(dashboardId.value)

    if (result.error?.status === 401) {
      result = await getThingsVisDashboard(dashboardId.value)
    }

    const { data } = result
    if (data) {
      projectTitle.value = data.name
      dashboardSchema.value = data
    }
  } catch (e) {
    console.warn('获取项目标题失败', e)
    dashboardSchema.value = null
  }
}

const goBack = () => {
  if (currentProjectId.value) {
    routerPushByKey('visualization_thingsvis-dashboards', {
      query: { projectId: currentProjectId.value }
    })
    return
  }

  routerPushByKey('visualization_thingsvis')
}

watch(
  dashboardId,
  () => {
    void loadDashboardInfo()
  },
  { immediate: true }
)
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <!-- 顶部导航栏 -->
    <div class="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-2 min-h-12">
      <NBreadcrumb>
        <NBreadcrumbItem class="cursor-pointer" @click="goBack">仪表盘列表</NBreadcrumbItem>
        <NBreadcrumbItem>
          {{ projectTitle || $t('common.loading') }}
        </NBreadcrumbItem>
      </NBreadcrumb>

      <NButton text @click="goBack">
        {{ $t('common.back') }}
      </NButton>
    </div>

    <!-- 编辑器区域 (全屏 Iframe) -->
    <div class="flex-1 overflow-hidden bg-white relative">
      <ThingsVisAppFrame
        v-if="dashboardId"
        :id="dashboardId"
        :schema="dashboardSchema"
        mode="editor"
      />
    </div>
  </div>
</template>
