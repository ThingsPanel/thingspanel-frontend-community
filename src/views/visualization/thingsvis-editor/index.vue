<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NSpace, NBreadcrumb, NBreadcrumbItem, useMessage, NTooltip } from 'naive-ui'
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
import { useFullscreen } from '@vueuse/core'

/** ... */
const editorContainerRef = ref<HTMLElement>()
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(editorContainerRef)
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
  } catch(e) {
    message.error($t('common.publishFailed') || '发布失败')
  } finally {
    loading.value = false
  }
}

const openInNewTab = () => {
  window.open(location.href, '_blank')
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
  } catch (e) {
    console.error('保存失败:', e)
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
  <div ref="editorContainerRef" class="h-full w-full flex flex-col bg-gray-50">
    <!-- 顶部工具栏 -->
    <div class="border-b border-gray-200 bg-white px-5 py-3">
      <div class="flex items-center justify-between">
        <!-- 左侧:面包屑和标题 -->
        <div class="flex flex-col gap-2">
          <NBreadcrumb>
            <NBreadcrumbItem class="cursor-pointer" @click="routerPushByKey('visualization_thingsvis')">
              可视化项目
            </NBreadcrumbItem>
            <NBreadcrumbItem class="cursor-pointer" @click="goBack">
              仪表盘列表
            </NBreadcrumbItem>
            <NBreadcrumbItem>{{ dashboardData?.name || '编辑器' }}</NBreadcrumbItem>
          </NBreadcrumb>

          <h2 class="text-lg font-semibold">
            {{ dashboardData?.name || '可视化编辑器' }}
          </h2>
        </div>

        <!-- 右侧:操作按钮 -->
        <NSpace>
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton quaternary circle @click="openInNewTab">
                <template #icon>
                  <icon-mdi:open-in-new />
                </template>
              </NButton>
            </template>
            新窗口打开
          </NTooltip>

          <NTooltip trigger="hover">
            <template #trigger>
              <NButton quaternary circle @click="toggleFullscreen">
                <template #icon>
                  <icon-mdi:fullscreen-exit v-if="isFullscreen" />
                  <icon-mdi:fullscreen v-else />
                </template>
              </NButton>
            </template>
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </NTooltip>

          <NButton @click="goBack">
            <template #icon>
              <icon-mdi:arrow-left />
            </template>
            {{ $t('common.back') }}
          </NButton>

          <NButton
            type="primary"
            :loading="saving"
            @click="editorRef?.triggerSave()"
          >
            <template #icon>
              <icon-mdi:content-save />
            </template>
            {{ $t('common.save') }}
          </NButton>
        </NSpace>
      </div>
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
