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
  NPopconfirm,
  NEmpty,
  NSpin,
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

const route = useRoute()
const { routerPushByKey } = useRouterPush()
const message = useMessage()

// 从路由获取项目ID
const projectId = computed(() => route.query.projectId as string)

// 状态
const loading = ref(false)
const project = ref<ThingsVisProject | null>(null)
const dashboards = ref<DashboardListItem[]>([])
const showModal = ref(false)
const searchKeyword = ref('')

// 表单数据
const formData = ref({
  name: '',
  canvasMode: 'fixed' as 'fixed' | 'grid' | 'infinite',
  canvasWidth: 1920,
  canvasHeight: 1080
})

/** 加载项目信息 */
const loadProject = async () => {
  if (!projectId.value) {
    message.error('缺少项目ID')
    return
  }

  try {
    const { data, error } = await getThingsVisProject(projectId.value)
    if (!error && data) {
      project.value = data
    }
  } catch (e) {
    console.error('加载项目失败:', e)
  }
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
      // 客户端搜索过滤
      let list = data.data
      if (searchKeyword.value) {
        list = list.filter(item =>
          item.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
        )
      }
      dashboards.value = list

      // 延迟加载缩略图
      loadThumbnails(list)
    } else if (error) {
      message.error('加载仪表盘失败')
    }
  } finally {
    loading.value = false
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
      await Promise.all(batch.map(async (item) => {
        // 如果已有缩略图则跳过 (比如已经是 base64)
        if (item.thumbnail && item.thumbnail.length > 1000) return

        try {
          const { data } = await getThingsVisDashboardThumbnail(item.id)
          if (data?.thumbnail) {
            // 更新响应式数据
            const target = dashboards.value.find(d => d.id === item.id)
            if (target) {
              target.thumbnail = data.thumbnail
            }
          }
        } catch (e) {
          console.error(`Failed to load thumbnail for ${item.id}`, e)
        }
      }))
    }
  }

  processQueue()
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
    const { error } = await createThingsVisDashboard({
      name: formData.value.name,
      projectId: projectId.value,
      canvasConfig: {
        mode: formData.value.canvasMode,
        width: formData.value.canvasWidth,
        height: formData.value.canvasHeight,
        background: '#f5f5f5'
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
    } else {
      message.error('创建失败')
    }
  } catch (e) {
    message.error('创建失败')
    console.error(e)
  }
}

/** 删除 Dashboard */
const handleDeleteDashboard = async (id: string, name: string) => {
  try {
    const { error } = await deleteThingsVisDashboard(id)
    if (!error) {
      message.success(`已删除仪表盘: ${name}`)
      await fetchDashboards()
    } else {
      message.error('删除失败')
    }
  } catch (e) {
    message.error('删除失败')
    console.error(e)
  }
}

/** 设为首页 */
const handleSetAsHomepage = async (dashboard: DashboardListItem) => {
  try {
    const { error } = await setHomeThingsVisDashboard(dashboard.id)
    if (!error) {
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

/** 打开编辑器 */
const openEditor = (dashboardId: string) => {
  routerPushByKey('visualization_thingsvis-editor', { query: { id: dashboardId } })
}

/** 返回项目列表 */
const goBackToProjects = () => {
  routerPushByKey('visualization_thingsvis')
}

onMounted(async () => {
  await loadProject()
  await fetchDashboards()
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
          <span class="text-gray-400">{{ dashboards.length }} 个仪表盘</span>
        </div>

        <div class="flex items-center gap-3">
          <!-- 搜索框 -->
          <NInput
            v-model:value="searchKeyword"
            clearable
            placeholder="搜索仪表盘名称..."
            style="width: 240px"
            @update:value="fetchDashboards"
            @clear="fetchDashboards"
          >
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
          description="暂无仪表盘，点击上方按钮创建第一个仪表盘"
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
              class="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-primary hover:shadow-lg"
              @click="openEditor(dashboard.id)"
            >
              <!-- 缩略图区域 -->
              <div class="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                <img
                  v-if="dashboard.thumbnail"
                  :src="dashboard.thumbnail"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  alt="thumbnail"
                />
                <icon-mdi:chart-box v-else class="text-64px text-primary/40" />

                <!-- 右上角首页图标 -->
                <div
                  v-if="dashboard.homeFlag"
                  class="absolute top-2 right-2 h-24px w-24px border-2 border-red-500 rounded-full text-center text-12px text-red-500 font-600 flex items-center justify-center bg-white"
                >
                  首
                </div>
              </div>

              <!-- 卡片内容 -->
              <div class="p-4">
                <!-- 看板名称和状态 -->
                <div class="mb-2 flex items-start justify-between gap-1">
                  <h3 class="flex-1 truncate font-semibold">
                    {{ dashboard.name }}
                  </h3>
                  <NTag v-if="dashboard.isPublished" size="small" type="success">
                    已发布
                  </NTag>
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

                <!-- 操作按钮(始终显示) -->
                <div class="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                  <NButton size="small" secondary class="flex-1" @click.stop="openEditor(dashboard.id)">
                    <template #icon>
                      <icon-mdi:pencil />
                    </template>
                    编辑
                  </NButton>

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
                      <NButton size="small" type="primary" secondary @click.stop disabled>
                        <template #icon>
                          <icon-mdi:home />
                        </template>
                      </NButton>
                    </template>
                    当前首页
                  </NTooltip>

                  <NPopconfirm @positive-click.stop="handleDeleteDashboard(dashboard.id, dashboard.name)">
                    <template #trigger>
                      <NButton size="small" secondary type="error" @click.stop>
                        <template #icon>
                          <icon-mdi:delete />
                        </template>
                      </NButton>
                    </template>
                    确定删除仪表盘"{{ dashboard.name }}"吗？
                  </NPopconfirm>
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
          <NInput
            v-model:value="formData.name"
            placeholder="请输入仪表盘名称"
            maxlength="50"
            show-count
          />
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
          <div class="mt-2 text-xs text-gray-400">
            常用尺寸: 1920×1080(大屏) / 1366×768(普通显示器)
          </div>
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="handleCreateDashboard">创建</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
