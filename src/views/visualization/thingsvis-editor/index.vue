<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import { $t } from '@/locales'
import { useRouterPush } from '@/hooks/common/router'
import { getThingsVisDashboard } from '@/service/api/thingsvis'
import ThingsVisAppFrame from '@/components/thingsvis/ThingsVisAppFrame.vue'

const route = useRoute()
const { routerPushByKey } = useRouterPush()

const dashboardId = route.query.id as string
const projectTitle = ref('')

/** 加载标题 (仅用于面包屑显示) */
const loadDashboardInfo = async () => {
  try {
    const { data } = await getThingsVisDashboard(dashboardId)
    if (data) {
      projectTitle.value = data.name
    }
  } catch (e) {
    console.warn('获取项目标题失败', e)
  }
}

const goBack = () => {
  routerPushByKey('visualization_thingsvis')
}

onMounted(() => {
  loadDashboardInfo()
})
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <!-- 顶部导航栏 -->
    <div class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 h-12">
      <NBreadcrumb>
        <NBreadcrumbItem class="cursor-pointer" @click="routerPushByKey('visualization_thingsvis')">
          {{ $t('route.visualization-thingsvis') }}
        </NBreadcrumbItem>
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
      <ThingsVisAppFrame :id="dashboardId" mode="editor" />
    </div>
  </div>
</template>
