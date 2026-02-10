<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NBreadcrumb, NBreadcrumbItem, useMessage } from 'naive-ui'
import { $t } from '@/locales'
import { useRouterPush } from '@/hooks/common/router'

import ThingsVisEditor from '@/components/thingsvis/ThingsVisEditor.vue'
import {
  getThingsVisDashboard,
  updateThingsVisDashboard,
  publishThingsVisDashboard
} from '@/service/api/thingsvis'

const route = useRoute()
const message = useMessage()
const { routerPushByKey } = useRouterPush()

const dashboardId = route.query.id as string
const loading = ref(true)
const saving = ref(false)
const dashboardData = ref<any>(null)
const isFullscreen = ref(false)
const editorContainerRef = ref<HTMLElement | null>(null)

/** 切换编辑器区域全屏 */
const toggleFullscreen = () => {
  if (!editorContainerRef.value) return
  
  if (!document.fullscreenElement) {
    editorContainerRef.value.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// 监听全屏变化
document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement
})

const handlePreview = (id: string) => {
  // 新标签页预览 - 使用独立的常量路由，无需登录
  window.open(`/thingsvis-preview?id=${id}`, '_blank')
}

const handlePublish = async (id: string) => {
  try {
    loading.value = true
    const { error } = await publishThingsVisDashboard(id)
    if (!error) {
      message.success($t('common.publishSuccess'))
    } else {
      message.error($t('common.publishFailed'))
    }
  } catch {
    message.error($t('common.publishFailed'))
  } finally {
    loading.value = false
  }
}

/** 构建编辑器初始配置 */
const initialConfig = computed(() => {
  if (!dashboardData.value) return null

  return {
    meta: {
      id: dashboardData.value.id,
      name: dashboardData.value.name,
      version: String(dashboardData.value.version)
    },
    canvas: dashboardData.value.canvasConfig,
    nodes: dashboardData.value.nodes || [],
    dataSources: dashboardData.value.dataSources || []
  }
})

/** 加载 Dashboard 数据 */
const loadDashboard = async () => {
  try {
    loading.value = true
    const { data, error } = await getThingsVisDashboard(dashboardId)

    if (!error && data) {
      dashboardData.value = data
    } else {
      message.error($t('common.loadFailed'))
    }
  } finally {
    loading.value = false
  }
}

/** 保存配置 */
const handleSave = async (payload: any) => {
  try {
    saving.value = true

    const { error } = await updateThingsVisDashboard(dashboardId, {
      name: payload.meta?.name || dashboardData.value.name,
      canvasConfig: payload.canvas,
      nodes: payload.nodes,
      dataSources: payload.dataSources
    })

    if (!error) {
      message.success($t('common.saveSuccess'))
      // 更新本地数据
      dashboardData.value = {
        ...dashboardData.value,
        canvasConfig: payload.canvas,
        nodes: payload.nodes,
        dataSources: payload.dataSources
      }
    } else {
      message.error($t('common.saveFailed'))
    }
  } catch {
    message.error($t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}

/** 返回仪表盘列表 */
const goBack = () => {
  if (dashboardData.value?.projectId) {
    routerPushByKey('visualization_thingsvis-dashboards', {
      query: { projectId: dashboardData.value.projectId }
    })
  } else {
    routerPushByKey('visualization_thingsvis')
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <!-- 顶部导航栏：面包屑 + 返回按钮 -->
    <div class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
      <NBreadcrumb>
        <NBreadcrumbItem class="cursor-pointer" @click="routerPushByKey('visualization_thingsvis')">
          {{ $t('route.visualization-thingsvis') }}
        </NBreadcrumbItem>
        <NBreadcrumbItem class="cursor-pointer" @click="goBack">
          {{ $t('route.visualization-thingsvis-dashboards') }}
        </NBreadcrumbItem>
        <NBreadcrumbItem>{{ dashboardData?.name || $t('route.visualization-thingsvis-editor') }}</NBreadcrumbItem>
      </NBreadcrumb>

      <div class="flex gap-2">
        <NButton size="small" @click="toggleFullscreen">
          <template #icon>
            <icon-mdi:fullscreen-exit v-if="isFullscreen" />
            <icon-mdi:fullscreen v-else />
          </template>
          {{ isFullscreen ? $t('icon.fullscreenExit') : $t('icon.fullscreen') }}
        </NButton>
        <NButton size="small" @click="goBack">
          <template #icon>
            <icon-mdi:arrow-left />
          </template>
          {{ $t('common.back') }}
        </NButton>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div ref="editorContainerRef" class="flex-1 overflow-hidden bg-white">
      <div v-if="loading" class="flex h-full items-center justify-center">
        <div class="text-center">
          <icon-mdi:loading class="animate-spin text-40px text-primary" />
          <p class="mt-2 text-gray-500">{{ $t('common.loading') }}</p>
        </div>
      </div>

      <ThingsVisEditor
        v-else-if="initialConfig"
        mode="editor"
        :initial-config="initialConfig"
        height="100%"
        show-top-left
        show-top-right
        save-target="self"
        @save="handleSave"
        @preview="handlePreview"
        @publish="handlePublish"
      />

      <div v-else class="flex h-full items-center justify-center">
        <div class="text-center text-gray-400">
          <icon-mdi:alert-circle-outline class="text-60px" />
          <p class="mt-2">{{ $t('common.loadFailedRetry') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
