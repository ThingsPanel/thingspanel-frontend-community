<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NSpin, useMessage } from 'naive-ui'
import ThingsVisEditor from '@/components/thingsvis/ThingsVisEditor.vue'
import { getThingsVisDashboard } from '@/service/api/thingsvis'

const route = useRoute()
const message = useMessage()

const dashboardId = route.query.id as string
const loading = ref(true)
const dashboardData = ref<any>(null)

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
  if (!dashboardId) {
    message.error('未指定仪表盘ID')
    return
  }

  try {
    loading.value = true
    const { data, error } = await getThingsVisDashboard(dashboardId)

    if (!error && data) {
      dashboardData.value = data
      // 设置页面标题
      document.title = `${data.name} - 预览`
    } else {
      message.error('加载失败')
    }
  } catch (e) {
    console.error('加载失败:', e)
    message.error('加载异常')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="h-full w-full bg-gray-50 dark:bg-gray-900">
    <!-- 加载中 -->
    <div v-if="loading" class="flex h-full items-center justify-center">
      <NSpin size="large" />
    </div>

    <!-- 预览器 -->
    <ThingsVisEditor
      v-else-if="initialConfig"
      mode="viewer"
      :initial-config="initialConfig"
      height="100%"
    />

    <!-- 错误/空状态 -->
    <div v-else class="flex h-full items-center justify-center text-gray-400">
      <div class="text-center">
        <p class="text-lg">无法加载仪表盘</p>
        <p class="text-sm mt-2 opacity-70">ID: {{ dashboardId }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 确保容器占满全屏，因为通常是在新标签页打开 */
:global(body), :global(#app) {
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
