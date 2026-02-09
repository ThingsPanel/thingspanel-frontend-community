<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const router = useRouter()
const message = useMessage()
const { routerPushByKey } = useRouterPush()

const dashboardId = route.query.id as string
const editorRef = ref<InstanceType<typeof ThingsVisEditor>>()
const loading = ref(true)
const saving = ref(false)
const dashboardData = ref<any>(null)

const handlePreview = (id: string) => {
  const routeUrl = router.resolve({
    name: 'visualization_thingsvis-preview',
    query: { id }
  })
  window.open(routeUrl.href, '_blank')
}

const handlePublish = async (id: string) => {
  try {
    loading.value = true
    const { error } = await publishThingsVisDashboard(id)
    if (!error) {
      message.success($t('common.publishSuccess') || '发布成功')
    } else {
      message.error($t('common.publishFailed') || '发布失败')
    }
  } catch {
    message.error($t('common.publishFailed') || '发布失败')
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
      // 🔍 调试：打印 API 返回的完整数据
      console.log('[thingsvis-editor] 📥 API 返回数据:', {
        id: data.id,
        name: data.name,
        canvasConfigName: data.canvasConfig?.name,
      })
      dashboardData.value = data
    } else {
      message.error('加载失败')
    }
  } finally {
    loading.value = false
  }
}

/** 保存配置 */
const handleSave = async (payload: any) => {
  console.log('[ThingsVisEditor] 保存回调:', payload)

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
          可视化项目
        </NBreadcrumbItem>
        <NBreadcrumbItem class="cursor-pointer" @click="goBack">
          仪表盘列表
        </NBreadcrumbItem>
        <NBreadcrumbItem>{{ dashboardData?.name || '编辑器' }}</NBreadcrumbItem>
      </NBreadcrumb>

      <NButton size="small" @click="goBack">
        <template #icon>
          <icon-mdi:arrow-left />
        </template>
        {{ $t('common.back') }}
      </NButton>
    </div>

    <!-- 编辑器区域 -->
    <div class="flex-1 overflow-hidden">
      <div v-if="loading" class="flex h-full items-center justify-center">
        <div class="text-center">
          <icon-mdi:loading class="animate-spin text-40px text-primary" />
          <p class="mt-2 text-gray-500">加载中...</p>
        </div>
      </div>

      <ThingsVisEditor
        v-else-if="initialConfig"
        ref="editorRef"
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
          <p class="mt-2">加载失败,请返回重试</p>
        </div>
      </div>
    </div>
  </div>
</template>
