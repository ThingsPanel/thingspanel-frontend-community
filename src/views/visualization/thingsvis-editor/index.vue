<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NBreadcrumb, NBreadcrumbItem, NInput, NSpace, NSwitch, useMessage } from 'naive-ui'
import { $t } from '@/locales'
import { useRouterPush } from '@/hooks/common/router'
import { getThingsVisDashboard, type ThingsVisDashboard } from '@/service/api/thingsvis'
import {
  deleteDashboardMenuConfig,
  fetchDashboardMenuConfig,
  saveDashboardMenuConfig
} from '@/service/api/dashboard-menu'
import ThingsVisAppFrame from '@/components/thingsvis/ThingsVisAppFrame.vue'
import { refreshAuthRoutes } from '@/utils/router/refresh-auth-routes'

const route = useRoute()
const { routerPushByKey } = useRouterPush()
const message = useMessage()

const dashboardId = computed(() => String(route.query.id || '').trim())
const currentProjectId = computed(() => {
  const routeProjectId = String(route.query.projectId || '').trim()
  return routeProjectId || dashboardSchema.value?.projectId || ''
})
const projectTitle = ref('')
const dashboardSchema = ref<ThingsVisDashboard | null>(null)
const menuSaving = ref(false)
const menuEnabled = ref(false)
const menuName = ref('')
const menuSort = ref(1)

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
      if (!menuEnabled.value && !menuName.value) {
        menuName.value = data.name
      }
    }
  } catch (e) {
    console.warn('获取项目标题失败', e)
    dashboardSchema.value = null
  }
}

const loadMenuConfig = async () => {
  if (!dashboardId.value) {
    menuEnabled.value = false
    menuName.value = ''
    menuSort.value = 1
    return
  }

  // const { data, error } = await fetchDashboardMenuConfig(dashboardId.value)
  // if (error) {
  //   return
  // }

  // if (data) {
  //   menuEnabled.value = Boolean(data.enabled)
  //   menuName.value = data.menu_name || projectTitle.value
  //   menuSort.value = data.sort || 1
  //   return
  // }

  menuEnabled.value = false
  menuName.value = projectTitle.value
  menuSort.value = 1
}

const persistMenuConfig = async (successMessage?: string) => {
  if (!dashboardId.value) return false

  if (menuEnabled.value && !menuName.value.trim()) {
    message.error('请输入菜单名称')
    return false
  }

  menuSaving.value = true
  try {
    let resultError: string | null = null

    // if (menuEnabled.value) {
    //   const { error } = await saveDashboardMenuConfig(dashboardId.value, {
    //     menu_name: menuName.value.trim(),
    //     dashboard_name: projectTitle.value || dashboardSchema.value?.name || menuName.value.trim(),
    //     sort: menuSort.value,
    //     enabled: true
    //   })
    //   resultError = error?.message || null
    // } else {
    //   const { error } = await deleteDashboardMenuConfig(dashboardId.value)
    //   resultError = error?.message || null
    // }

    // if (resultError) {
    //   message.error(`菜单配置保存失败: ${resultError}`)
    //   return false
    // }

    // await refreshAuthRoutes(route.fullPath)
    // if (successMessage) {
    //   message.success(successMessage)
    // }
    return true
  } finally {
    menuSaving.value = false
  }
}

const handleSaveMenuConfig = async () => {
  await persistMenuConfig('菜单配置已保存')
}

const handleHostSaveSuccess = async () => {
  await loadDashboardInfo()

  if (!menuEnabled.value && !menuName.value.trim()) {
    return
  }

  await persistMenuConfig()
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
    void loadMenuConfig()
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

    <div class="flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 py-2">
      <div class="text-sm text-gray-500">系统菜单配置</div>

      <NSpace align="center" :size="12">
        <span class="text-sm text-gray-500">设为系统菜单</span>
        <NSwitch
          v-model:value="menuEnabled"
          @update:value="
            value => {
              if (value && !menuName) menuName = projectTitle
            }
          "
        />
        <NInput
          v-model:value="menuName"
          :disabled="!menuEnabled"
          placeholder="菜单名称"
          clearable
          style="width: 220px"
        />
        <NButton size="small" type="primary" ghost :loading="menuSaving" @click="handleSaveMenuConfig">
          保存菜单
        </NButton>
      </NSpace>
    </div>

    <!-- 编辑器区域 (全屏 Iframe) -->
    <div class="flex-1 overflow-hidden bg-white relative">
      <ThingsVisAppFrame
        v-if="dashboardId"
        :id="dashboardId"
        :schema="dashboardSchema"
        mode="editor"
        @host-save-success="handleHostSaveSuccess"
      />
    </div>
  </div>
</template>
