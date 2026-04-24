<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton,
  NCard,
  NGrid,
  NGridItem,
  NBreadcrumb,
  NBreadcrumbItem,
  NInput,
  NModal,
  NForm,
  NFormItem,
  NEmpty,
  NSpin,
  NSwitch,
  NTag,
  NInputNumber,
  NTooltip,
  useMessage
} from 'naive-ui'
import { useRouterPush } from '@/hooks/common/router'
import {
  getThingsVisDashboards,
  getThingsVisProject,
  createThingsVisDashboard,
  deleteThingsVisDashboard,
  setHomeThingsVisDashboard,
  getThingsVisDashboardThumbnail,
  type DashboardListItem,
  type ThingsVisProject
} from '@/service/api/thingsvis'
import {
  deleteDashboardMenuConfig,
  fetchDashboardMenuConfig,
  saveDashboardMenuConfig,
  type DashboardMenuConfig
} from '@/service/api/dashboard-menu'
import { clearThingsVisHomeCache } from '@/utils/thingsvis/home-cache'
import { refreshAuthRoutes } from '@/utils/router/refresh-auth-routes'

const route = useRoute()
const { routerPushByKey } = useRouterPush()
const message = useMessage()

// 从路由获取项目ID
const projectId = computed(() => route.query.projectId as string)

// 状态
const loading = ref(false)
const deletingId = ref<string | null>(null)
const project = ref<ThingsVisProject | null>(null)
const allDashboards = ref<DashboardListItem[]>([])
const showModal = ref(false)
const searchKeyword = ref('')
const menuConfigs = ref<Record<string, DashboardMenuConfig | null>>({})
const menuConfigLoadSeq = ref(0)
const showMenuModal = ref(false)
const menuSaving = ref(false)
const deleteConfirmModal = ref(false)
const pendingDeleteDashboard = ref<{ id: string; name: string } | null>(null)
const menuForm = ref({
  dashboardId: '',
  dashboardName: '',
  enabled: false,
  menuName: '',
  menuSort: 1
})

// 表单数据
const formData = ref({
  name: '',
  canvasMode: 'fixed' as 'fixed' | 'grid' | 'infinite',
  canvasWidth: 1920,
  canvasHeight: 1080
})

const dashboards = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return allDashboards.value

  return allDashboards.value.filter(item => item.name.toLowerCase().includes(keyword))
})

/** 加载项目信息 */
const loadProject = async () => {
  if (!projectId.value) {
    message.error('缺少项目ID')
    return false
  }

  try {
    const { data, error } = await getThingsVisProject(projectId.value)
    if (!error && data) {
      project.value = data
      return true
    }
  } catch (e) {
    console.error('加载项目失败:', e)
  }

  return false
}

/** 加载 Dashboard 列表 */
const fetchDashboards = async () => {
  if (!projectId.value) return

  loading.value = true
  try {
    const { data, error } = await getThingsVisDashboards({
      projectId: projectId.value,
      page: 1,
      limit: 100
    })

    if (!error && data) {
      const list = data.data
      allDashboards.value = list

      // 延迟加载缩略图和菜单配置
      void loadThumbnails(list)
      void loadMenuConfigs(list)
    } else if (error) {
      message.error('加载仪表盘失败')
    }
  } finally {
    loading.value = false
  }
}

/** 加载每个仪表盘的系统菜单配置 */
const loadMenuConfigs = async (list: DashboardListItem[]) => {
  const loadSeq = menuConfigLoadSeq.value + 1
  menuConfigLoadSeq.value = loadSeq
  const entries = await Promise.all(
    list.map(async item => {
      const { data, error } = await fetchDashboardMenuConfig(item.id)
      return [item.id, error ? (menuConfigs.value[item.id] ?? null) : (data ?? null)] as const
    })
  )

  if (loadSeq !== menuConfigLoadSeq.value) return

  menuConfigs.value = {
    ...menuConfigs.value,
    ...Object.fromEntries(entries)
  }
}

/** 懒加载缩略图 */
const loadThumbnails = async (list: DashboardListItem[]) => {
  // 并发控制，每次请求 5 个
  const CONCURRENCY = 5
  const queue = [...list]

  const processQueue = async () => {
    while (queue.length > 0) {
      const batch = queue.splice(0, CONCURRENCY)
      await Promise.all(
        batch.map(async item => {
          // 检查是否已有有效的缩略图（处理 null、undefined、空字符串）
          const hasValidThumbnail = item.thumbnail && item.thumbnail.trim().startsWith('data:')
          if (hasValidThumbnail) return

          try {
            const result = await getThingsVisDashboardThumbnail(item.id)
            // 处理可能的嵌套数据结构
            const resultData = result.data as { thumbnail?: string | null; data?: { thumbnail?: string | null } } | null
            const thumbnail = resultData?.thumbnail || resultData?.data?.thumbnail
            if (thumbnail) {
              // 更新响应式数据
              const target = allDashboards.value.find(d => d.id === item.id)
              if (target) {
                target.thumbnail = thumbnail
              }
            }
          } catch (e) {
            console.error(`[loadThumbnails] 加载缩略图失败 ${item.id}:`, e)
          }
        })
      )
    }
  }

  await processQueue()
}

/** 打开新建弹窗 */
const openCreateModal = () => {
  formData.value = {
    name: '',
    canvasMode: 'fixed',
    canvasWidth: 1920,
    canvasHeight: 1080
  }
  showModal.value = true
}

/** 创建 Dashboard */
const handleCreateDashboard = async () => {
  if (!formData.value.name.trim()) {
    message.error('请输入仪表盘名称')
    return
  }

  try {
    const { data, error } = await createThingsVisDashboard({
      name: formData.value.name,
      projectId: projectId.value,
      canvasConfig: {
        mode: formData.value.canvasMode,
        width: formData.value.canvasWidth,
        height: formData.value.canvasHeight,
        background: {
          color: 'transparent'
        }
      }
    })

    if (!error) {
      message.success('创建成功')
      showModal.value = false
      formData.value = {
        name: '',
        canvasMode: 'fixed',
        canvasWidth: 1920,
        canvasHeight: 1080
      }
      await fetchDashboards()
      if (data?.id) {
        openMenuConfig({
          ...data,
          homeFlag: false
        } as DashboardListItem)
      }
    } else {
      message.error('创建失败')
    }
  } catch (e) {
    message.error('创建失败')
    console.error(e)
  }
}

/** 删除 Dashboard */
const openDeleteConfirm = (id: string, name: string) => {
  pendingDeleteDashboard.value = { id, name }
  deleteConfirmModal.value = true
}

const handleDeleteDashboard = async () => {
  if (!pendingDeleteDashboard.value || deletingId.value) return
  deletingId.value = pendingDeleteDashboard.value.id
  try {
    const { id } = pendingDeleteDashboard.value
    const { error: menuError } = await deleteDashboardMenuConfig(id)
    if (menuError) {
      message.error('删除失败：无法清理关联菜单')
      return
    }

    const { error } = await deleteThingsVisDashboard(id)
    if (!error) {
      deleteConfirmModal.value = false
      pendingDeleteDashboard.value = null
      await refreshAuthRoutes(route.fullPath)
      clearThingsVisHomeCache()
      await fetchDashboards()
    } else {
      console.warn(`[handleDeleteDashboard] 菜单 ${id} 已删除，但 ThingsVis 仪表盘删除失败`)
      message.error('删除失败')
    }
  } catch (e) {
    message.error('删除失败')
    console.error(e)
  } finally {
    deletingId.value = null
  }
}

/** 设为首页 */
const handleSetAsHomepage = async (dashboard: DashboardListItem) => {
  try {
    const { error } = await setHomeThingsVisDashboard(dashboard.id)
    if (!error) {
      clearThingsVisHomeCache()
      message.success(`已将"${dashboard.name}"设为首页`)
      await fetchDashboards()
    } else {
      message.error('设置首页失败')
    }
  } catch (e) {
    message.error('设置首页失败')
    console.error(e)
  }
}

/** 打开系统菜单配置 */
const openMenuConfig = (dashboard: DashboardListItem) => {
  const config = menuConfigs.value[dashboard.id]
  menuForm.value = {
    dashboardId: dashboard.id,
    dashboardName: dashboard.name,
    enabled: Boolean(config?.enabled),
    menuName: config?.menu_name || dashboard.name,
    menuSort: config?.sort || 1
  }
  showMenuModal.value = true
}

/** 保存系统菜单配置 */
const handleSaveMenuConfig = async () => {
  if (!menuForm.value.dashboardId) return

  if (menuForm.value.enabled && !menuForm.value.menuName.trim()) {
    message.error('请输入菜单名称')
    return
  }

  menuConfigLoadSeq.value += 1
  menuSaving.value = true
  try {
    let resultError: string | null = null

    if (menuForm.value.enabled) {
      const { data, error } = await saveDashboardMenuConfig(menuForm.value.dashboardId, {
        menu_name: menuForm.value.menuName.trim(),
        dashboard_name: menuForm.value.dashboardName,
        sort: menuForm.value.menuSort,
        enabled: true
      })
      resultError = error?.message || null
      if (!resultError) {
        menuConfigs.value = {
          ...menuConfigs.value,
          [menuForm.value.dashboardId]: data
        }
      }
    } else {
      const { error } = await deleteDashboardMenuConfig(menuForm.value.dashboardId)
      resultError = error?.message || null
      if (!resultError) {
        menuConfigs.value = {
          ...menuConfigs.value,
          [menuForm.value.dashboardId]: null
        }
      }
    }

    if (resultError) {
      message.error(`菜单配置保存失败: ${resultError}`)
      return
    }

    await refreshAuthRoutes(route.fullPath)
    showMenuModal.value = false
    message.success('菜单配置已保存')
  } finally {
    menuSaving.value = false
  }
}

/** 处理缩略图 URL，确保 base64 格式正确 */
const getThumbnailUrl = (thumbnail: string | null | undefined): string | null => {
  if (!thumbnail) return null
  // 如果已经是完整的 data URI，直接返回
  if (thumbnail.startsWith('data:')) return thumbnail
  // 如果已经是 http/https URL，直接返回
  if (thumbnail.startsWith('http')) return thumbnail
  // 否则添加 base64 前缀（默认按 png 处理）
  return `data:image/png;base64,${thumbnail}`
}

/** 浏览页地址 */
const getViewerHref = (dashboardId: string) => `/tv-preview?id=${encodeURIComponent(dashboardId)}`

/** 打开编辑器 */
const openEditor = (dashboardId: string) => {
  routerPushByKey('visualization_thingsvis-editor', {
    query: {
      id: dashboardId,
      projectId: projectId.value
    }
  })
}

/** 返回项目列表 */
const goBackToProjects = () => {
  routerPushByKey('visualization_thingsvis')
}

onMounted(async () => {
  const projectLoaded = await loadProject()
  if (projectLoaded) {
    await fetchDashboards()
  }
})
</script>

<template>
  <div class="h-full">
    <NCard>
      <!-- 面包屑导航 -->
      <NBreadcrumb class="mb-4">
        <NBreadcrumbItem class="cursor-pointer" @click="goBackToProjects">
          <div class="flex items-center gap-1">
            <icon-mdi:chevron-left />
            可视化项目
          </div>
        </NBreadcrumbItem>
        <NBreadcrumbItem>{{ project?.name || '加载中...' }}</NBreadcrumbItem>
      </NBreadcrumb>

      <!-- 头部工具栏 -->
      <div class="mb-5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold">{{ project?.name }}</h2>
          <span class="text-gray-400">
            {{ searchKeyword ? `${dashboards.length} / ${allDashboards.length}` : dashboards.length }} 个仪表盘
          </span>
        </div>

        <div class="flex items-center gap-3">
          <!-- 搜索框 -->
          <NInput v-model:value="searchKeyword" clearable placeholder="搜索仪表盘名称..." style="width: 240px">
            <template #prefix>
              <icon-mdi:magnify />
            </template>
          </NInput>

          <!-- 新建按钮 -->
          <NButton type="primary" @click="openCreateModal">
            <template #icon>
              <icon-mdi:plus />
            </template>
            新建仪表盘
          </NButton>
        </div>
      </div>

      <!-- 项目描述 -->
      <div v-if="project?.description" class="mb-4 text-sm text-gray-500">
        {{ project.description }}
      </div>

      <!-- 加载状态 -->
      <NSpin :show="loading">
        <!-- 空状态 -->
        <NEmpty
          v-if="!loading && dashboards.length === 0"
          :description="allDashboards.length === 0 ? '暂无仪表盘，点击上方按钮创建第一个仪表盘' : '没有匹配的仪表盘'"
          class="py-20"
        >
          <template #icon>
            <icon-mdi:chart-box-outline class="text-50px text-gray-300" />
          </template>
        </NEmpty>

        <!-- Dashboard 网格 -->
        <NGrid v-else x-gap="24" y-gap="24" cols="1 s:2 m:3 l:4" responsive="screen">
          <NGridItem v-for="dashboard in dashboards" :key="dashboard.id">
            <!-- Dashboard 卡片 -->
            <div
              class="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-primary hover:shadow-lg"
            >
              <a
                class="block cursor-pointer no-underline"
                :href="getViewerHref(dashboard.id)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <!-- 缩略图区域 -->
                <div
                  class="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden"
                >
                  <img
                    v-if="dashboard.thumbnail"
                    :src="getThumbnailUrl(dashboard.thumbnail)"
                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt="thumbnail"
                  />
                  <icon-mdi:chart-box v-else class="text-64px text-primary/40" />

                  <!-- 右上角首页图标 -->
                  <div
                    v-if="dashboard.homeFlag"
                    class="absolute top-2 right-2 h-24px w-24px border-2 border-red-500 rounded-full text-center text-12px text-red-500 font-600 flex items-center justify-center bg-white shadow-sm"
                  >
                    首
                  </div>
                </div>

                <!-- 卡片内容 -->
                <div class="p-4">
                  <!-- 看板名称和状态 -->
                  <div class="mb-2 flex items-start justify-between gap-1">
                    <h3 class="flex-1 truncate font-semibold text-gray-900">
                      {{ dashboard.name }}
                    </h3>
                    <NTag v-if="dashboard.isPublished" size="small" type="success">已发布</NTag>
                    <NTag v-if="menuConfigs[dashboard.id]?.enabled" size="small" type="info">系统菜单</NTag>
                  </div>

                  <!-- 底部信息 -->
                  <div class="flex items-center justify-between text-xs text-gray-400">
                    <div class="flex items-center gap-1">
                      <icon-mdi:tag-outline />
                      <span>v{{ dashboard.version }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <icon-mdi:clock-outline />
                      <span>{{ new Date(dashboard.updatedAt).toLocaleDateString() }}</span>
                    </div>
                  </div>
                </div>
              </a>

              <!-- 操作按钮(始终显示) -->
              <div class="px-4 pb-4">
                <div class="flex gap-2 border-t border-gray-100 pt-3">
                  <NButton size="small" secondary class="flex-1" @click.stop="openEditor(dashboard.id)">
                    <template #icon>
                      <icon-mdi:pencil />
                    </template>
                    编辑
                  </NButton>

                  <NTooltip>
                    <template #trigger>
                      <NButton
                        size="small"
                        :type="menuConfigs[dashboard.id]?.enabled ? 'info' : 'default'"
                        secondary
                        @click.stop="openMenuConfig(dashboard)"
                      >
                        <template #icon>
                          <icon-mdi:menu />
                        </template>
                      </NButton>
                    </template>
                    {{ menuConfigs[dashboard.id]?.enabled ? '编辑系统菜单' : '设为系统菜单' }}
                  </NTooltip>

                  <!-- 设为首页按钮 -->
                  <NTooltip v-if="!dashboard.homeFlag">
                    <template #trigger>
                      <NPopconfirm @positive-click.stop="handleSetAsHomepage(dashboard)">
                        <template #trigger>
                          <NButton size="small" secondary @click.stop>
                            <template #icon>
                              <icon-mdi:home-outline />
                            </template>
                          </NButton>
                        </template>
                        设为首页后，其他仪表盘的首页标记将被取消
                      </NPopconfirm>
                    </template>
                    设为首页
                  </NTooltip>
                  <NTooltip v-else>
                    <template #trigger>
                      <NButton size="small" type="primary" secondary disabled @click.stop>
                        <template #icon>
                          <icon-mdi:home />
                        </template>
                      </NButton>
                    </template>
                    当前首页
                  </NTooltip>

                  <NButton
                    size="small"
                    secondary
                    type="error"
                    @click.stop="openDeleteConfirm(dashboard.id, dashboard.name)"
                  >
                    <template #icon>
                      <icon-mdi:delete />
                    </template>
                  </NButton>
                </div>
              </div>
            </div>
          </NGridItem>
        </NGrid>
      </NSpin>
    </NCard>

    <!-- 新建弹窗 -->
    <NModal v-model:show="showModal" preset="card" title="新建仪表盘" class="w-500px">
      <NForm :model="formData">
        <NFormItem label="仪表盘名称" path="name">
          <NInput v-model:value="formData.name" placeholder="请输入仪表盘名称" maxlength="50" show-count />
        </NFormItem>

        <NFormItem label="画布模式">
          <div class="flex gap-2">
            <NButton
              :type="formData.canvasMode === 'fixed' ? 'primary' : 'default'"
              @click="formData.canvasMode = 'fixed'"
            >
              固定尺寸
            </NButton>
            <NButton
              :type="formData.canvasMode === 'grid' ? 'primary' : 'default'"
              @click="formData.canvasMode = 'grid'"
            >
              网格布局
            </NButton>
            <NButton
              :type="formData.canvasMode === 'infinite' ? 'primary' : 'default'"
              @click="formData.canvasMode = 'infinite'"
            >
              无限画布
            </NButton>
          </div>
        </NFormItem>

        <NFormItem v-if="formData.canvasMode === 'fixed'" label="画布尺寸">
          <div class="flex items-center gap-2">
            <NInputNumber
              v-model:value="formData.canvasWidth"
              placeholder="宽度"
              style="width: 120px"
              :show-button="false"
            />
            <span>×</span>
            <NInputNumber
              v-model:value="formData.canvasHeight"
              placeholder="高度"
              style="width: 120px"
              :show-button="false"
            />
            <span class="text-sm text-gray-400">px</span>
          </div>
          <div class="mt-2 text-xs text-gray-400">常用尺寸: 1920×1080(大屏) / 1366×768(普通显示器)</div>
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="handleCreateDashboard">创建</NButton>
        </div>
      </template>
    </NModal>

    <!-- 系统菜单配置 -->
    <NModal v-model:show="showMenuModal" preset="card" title="系统菜单配置" class="w-500px">
      <NForm :model="menuForm">
        <NFormItem label="仪表盘">
          <NInput :value="menuForm.dashboardName" disabled />
        </NFormItem>

        <NFormItem label="设为系统菜单">
          <NSwitch
            v-model:value="menuForm.enabled"
            @update:value="
              value => {
                if (value && !menuForm.menuName) menuForm.menuName = menuForm.dashboardName
              }
            "
          />
        </NFormItem>

        <NFormItem v-if="menuForm.enabled" label="菜单名称">
          <NInput v-model:value="menuForm.menuName" placeholder="请输入菜单名称" maxlength="50" show-count />
        </NFormItem>

        <NFormItem v-if="menuForm.enabled" label="菜单排序">
          <NInputNumber
            v-model:value="menuForm.menuSort"
            :min="1"
            :precision="0"
            placeholder="排序值"
            style="width: 160px"
          />
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showMenuModal = false">取消</NButton>
          <NButton type="primary" :loading="menuSaving" @click="handleSaveMenuConfig">保存菜单</NButton>
        </div>
      </template>
    </NModal>

    <!-- 删除仪表盘确认弹窗 -->
    <NModal
      v-model:show="deleteConfirmModal"
      preset="dialog"
      type="warning"
      title="确认删除"
      :action-style="{ gap: '8px' }"
    >
      <template #icon>
        <icon-mdi:alert-circle class="text-24px text-orange-400" />
      </template>
      <template #default>确定删除仪表盘"{{ pendingDeleteDashboard?.name }}"吗？该操作不可恢复。</template>
      <template #action>
        <NButton :disabled="!!deletingId" @click="deleteConfirmModal = false">取消</NButton>
        <NButton type="error" :loading="!!deletingId" @click="handleDeleteDashboard">确认删除</NButton>
      </template>
    </NModal>
  </div>
</template>
