<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton,
  NCard,
  NGrid,
  NGridItem,
  NInput,
  NModal,
  NForm,
  NFormItem,
  NEmpty,
  NSpin,
  NSelect,
  NTag,
  useMessage
} from 'naive-ui'
import { useRouterPush } from '@/hooks/common/router'
import {
  getThingsVisProjects,
  getThingsVisDashboards,
  createThingsVisProject,
  updateThingsVisProject,
  deleteThingsVisProject,
  createThingsVisDashboard,
  type ProjectListItem,
  type DashboardListItem
} from '@/service/api/thingsvis'
import { deleteDashboardMenuConfig } from '@/service/api/dashboard-menu'
import { refreshAuthRoutes } from '@/utils/router/refresh-auth-routes'
import { clearThingsVisHomeCache } from '@/utils/thingsvis/home-cache'

const { routerPushByKey } = useRouterPush()
const message = useMessage()
const route = useRoute()

// 状态
const loading = ref(false)
const deletingId = ref<string | null>(null)
const allProjects = ref<ProjectListItem[]>([])
const projects = ref<ProjectListItem[]>([])
const showModal = ref(false)
const editingProject = ref<ProjectListItem | null>(null)
const searchKeyword = ref('')
const matchedDashboards = ref<DashboardListItem[]>([])
const showDashboardModal = ref(false)
const dashboardCreating = ref(false)
const deleteConfirmModal = ref(false)
const pendingDeleteProject = ref<{ id: string; name: string } | null>(null)

// 表单数据
const formData = ref({
  name: '',
  description: ''
})
const dashboardForm = ref({ name: '', projectId: null as string | null })
const projectOptions = computed(() => allProjects.value.map(project => ({ label: project.name, value: project.id })))
const isDefaultProjectItem = (project: ProjectListItem) =>
  project.isDefault || project.name === '默认项目' || project.name === 'Default Project'

const resetSearch = () => {
  searchKeyword.value = ''
  void fetchProjects()
}

/** 获取项目列表 */
const fetchProjects = async () => {
  loading.value = true
  try {
    const { data, error } = await getThingsVisProjects({ page: 1, limit: 100 })
    if (!error && data) {
      allProjects.value = data.data
      let list = allProjects.value
      if (searchKeyword.value) {
        list = list.filter(item => item.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
      }
      projects.value = list
      const keyword = searchKeyword.value.trim()
      if (keyword) {
        const dashboardResult = await getThingsVisDashboards({ keyword, page: 1, limit: 100 })
        matchedDashboards.value = dashboardResult.data?.data || []
      } else {
        matchedDashboards.value = []
      }
    } else if (error) {
      message.error('加载项目失败')
    }
  } finally {
    loading.value = false
  }
}

const openCreateDashboardModal = () => {
  dashboardForm.value = { name: '', projectId: null }
  showDashboardModal.value = true
}

const handleCreateDashboard = async () => {
  const name = dashboardForm.value.name.trim()
  if (!name) {
    message.error('请输入看板名称')
    return
  }

  dashboardCreating.value = true
  try {
    const { data, error } = await createThingsVisDashboard({
      name,
      projectId: dashboardForm.value.projectId || undefined
    })
    if (error || !data) {
      message.error(error?.message || '创建看板失败')
      return
    }
    showDashboardModal.value = false
    await fetchProjects()
    routerPushByKey('visualization_thingsvis-editor', {
      query: { id: data.id, projectId: data.projectId }
    })
  } finally {
    dashboardCreating.value = false
  }
}

const openDashboard = (dashboard: DashboardListItem) => {
  routerPushByKey('visualization_thingsvis-editor', {
    query: { id: dashboard.id, projectId: dashboard.projectId }
  })
}

/** 打开新建弹窗 */
const openCreateModal = () => {
  editingProject.value = null
  formData.value = { name: '', description: '' }
  showModal.value = true
}

/** 打开编辑弹窗 */
const openEditModal = (project: ProjectListItem) => {
  editingProject.value = project
  formData.value = {
    name: project.name,
    description: project.description || ''
  }
  showModal.value = true
}

/** 保存项目(新建/编辑) */
const handleSaveProject = async () => {
  if (!formData.value.name.trim()) {
    message.error('请输入项目名称')
    return
  }

  try {
    if (editingProject.value) {
      // 编辑
      const { error } = await updateThingsVisProject(editingProject.value.id, {
        name: formData.value.name,
        description: formData.value.description || null
      })
      if (!error) {
        message.success('更新成功')
        showModal.value = false
        await fetchProjects()
      } else {
        message.error('更新失败')
      }
    } else {
      // 新建
      const { error } = await createThingsVisProject({
        name: formData.value.name,
        description: formData.value.description || undefined
      })
      if (!error) {
        message.success('创建成功')
        showModal.value = false
        formData.value = { name: '', description: '' }
        await fetchProjects()
      } else {
        message.error('创建失败')
      }
    }
  } catch (e) {
    message.error('操作失败')
    console.error(e)
  }
}

/** 删除项目 */
const openDeleteConfirm = (id: string, name: string) => {
  const project = projects.value.find(item => item.id === id)
  if ((project?._count?.dashboards || 0) > 0) {
    message.warning('该项目下有仪表盘，无法删除。请先删除所有仪表盘。')
    return
  }

  pendingDeleteProject.value = { id, name }
  deleteConfirmModal.value = true
}

const handleDeleteProject = async () => {
  if (!pendingDeleteProject.value || deletingId.value) return
  deletingId.value = pendingDeleteProject.value.id
  try {
    const { id } = pendingDeleteProject.value
    const { data: dashboardsData } = await getThingsVisDashboards({
      projectId: id,
      page: 1,
      limit: 1000
    })
    const dashboardIds = (dashboardsData?.data || []).map((d: { id: string }) => d.id)

    for (const did of dashboardIds) {
      const { error } = await deleteDashboardMenuConfig(did)
      if (error) {
        message.error('删除失败：无法清理部分关联菜单')
        return
      }
    }

    const { error } = await deleteThingsVisProject(id)
    if (!error) {
      const deletedName = pendingDeleteProject.value?.name || ''
      deleteConfirmModal.value = false
      pendingDeleteProject.value = null
      await refreshAuthRoutes(route.fullPath)
      clearThingsVisHomeCache()
      message.success(`已删除项目: ${deletedName}`)
      await fetchProjects()
    } else {
      console.warn(`[handleDeleteProject] 项目 ${id} 删除失败`)
      message.error('删除失败')
    }
  } catch (e) {
    message.error('删除失败')
    console.error(e)
  } finally {
    deletingId.value = null
  }
}

/** 进入项目(查看 Dashboards) */
const enterProject = (projectId: string) => {
  routerPushByKey('visualization_thingsvis-dashboards', { query: { projectId } })
}

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div class="h-full">
    <NCard>
      <!-- 头部工具栏 -->
      <div class="visualization-page-header mb-5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold">可视化项目</h2>
          <span class="text-gray-400">{{ projects.length }} 个项目</span>
        </div>

        <div class="visualization-filter-toolbar">
          <!-- 搜索框 -->
          <NInput
            v-model:value="searchKeyword"
            clearable
            placeholder="搜索项目或看板..."
            class="visualization-filter-control visualization-filter-control--search"
            @update:value="fetchProjects"
            @clear="fetchProjects"
          >
            <template #prefix>
              <icon-mdi:magnify />
            </template>
          </NInput>

          <NButton class="visualization-filter-button" @click="resetSearch">重置</NButton>

          <!-- 新建按钮 -->
          <NButton class="visualization-filter-button" type="primary" @click="openCreateDashboardModal">
            <template #icon>
              <icon-mdi:plus />
            </template>
            新建看板
          </NButton>
          <NButton class="visualization-filter-button" secondary @click="openCreateModal">
            <template #icon><icon-mdi:plus /></template>
            新建项目
          </NButton>
        </div>
      </div>

      <!-- 加载状态 -->
      <NSpin :show="loading">
        <!-- 空状态 -->
        <NEmpty
          v-if="!loading && !searchKeyword.trim() && projects.length === 0"
          description="暂无项目，可直接新建看板并保存到默认项目"
          class="py-20"
        >
          <template #icon>
            <icon-mdi:folder-open-outline class="text-50px text-gray-300" />
          </template>
        </NEmpty>

        <template v-if="searchKeyword.trim()">
          <div class="mb-4 flex items-center gap-3">
            <h3 class="text-lg font-semibold">匹配的看板</h3>
            <span class="text-gray-400">{{ matchedDashboards.length }} 个</span>
          </div>
          <NEmpty v-if="matchedDashboards.length === 0" description="没有匹配的看板" class="py-8" />
          <NGrid v-else x-gap="16" y-gap="16" cols="1 s:2 m:3 l:4" responsive="screen">
            <NGridItem v-for="dashboard in matchedDashboards" :key="dashboard.id">
              <div
                class="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 hover:border-primary hover:shadow"
                @click="openDashboard(dashboard)"
              >
                <div class="mb-2 flex items-center justify-between gap-2">
                  <h3 class="truncate font-semibold">{{ dashboard.name }}</h3>
                  <NTag size="small" :bordered="false">看板</NTag>
                </div>
                <div class="truncate text-sm text-gray-500">所属项目：{{ dashboard.project?.name || '默认项目' }}</div>
              </div>
            </NGridItem>
          </NGrid>

          <div class="mb-4 mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
            <h3 class="text-lg font-semibold">匹配的项目</h3>
            <span class="text-gray-400">{{ projects.length }} 个</span>
          </div>
          <NEmpty v-if="projects.length === 0" description="没有匹配的项目" class="py-8" />
        </template>

        <!-- 项目网格 -->
        <NGrid v-if="projects.length > 0" x-gap="24" y-gap="24" cols="1 s:2 m:3 l:4" responsive="screen">
          <NGridItem v-for="project in projects" :key="project.id">
            <!-- 项目卡片 -->
            <div
              class="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-primary hover:shadow-lg"
              @click="enterProject(project.id)"
            >
              <!-- 卡片内容 -->
              <div class="p-5">
                <!-- 顶部:图标和操作按钮 -->
                <div class="mb-3 flex items-start justify-between">
                  <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <icon-mdi:folder class="text-24px text-primary" />
                  </div>

                  <!-- 操作按钮(悬停显示) -->
                  <div
                    v-if="!isDefaultProjectItem(project)"
                    class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <NButton size="small" quaternary circle @click.stop="openEditModal(project)">
                      <template #icon>
                        <icon-mdi:pencil class="text-16px" />
                      </template>
                    </NButton>

                    <NButton size="small" quaternary circle @click.stop="openDeleteConfirm(project.id, project.name)">
                      <template #icon>
                        <icon-mdi:delete class="text-16px" />
                      </template>
                    </NButton>
                  </div>
                </div>

                <!-- 项目名称 -->
                <h3 class="mb-2 truncate text-lg font-semibold">
                  {{ project.name }}
                  <NTag v-if="isDefaultProjectItem(project)" size="small" type="info" :bordered="false">默认</NTag>
                </h3>

                <!-- 项目描述 -->
                <p class="mb-4 line-clamp-2 h-10 text-sm text-gray-500">
                  {{ project.description || '暂无描述' }}
                </p>

                <!-- 底部信息 -->
                <div class="flex items-center justify-between text-xs text-gray-400">
                  <div class="flex items-center gap-1">
                    <icon-mdi:chart-box-outline />
                    <span>{{ project._count?.dashboards || 0 }} 个仪表盘</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <icon-mdi:clock-outline />
                    <span>{{ new Date(project.updatedAt).toLocaleDateString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </NGridItem>
        </NGrid>
      </NSpin>
    </NCard>

    <!-- 新建/编辑弹窗 -->
    <NModal v-model:show="showModal" preset="card" :title="editingProject ? '编辑项目' : '新建项目'" class="w-500px">
      <NForm :model="formData">
        <NFormItem label="项目名称" path="name">
          <NInput v-model:value="formData.name" placeholder="请输入项目名称" maxlength="50" show-count />
        </NFormItem>

        <NFormItem label="项目描述">
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入项目描述(可选)"
            :rows="4"
            maxlength="200"
            show-count
          />
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="handleSaveProject">
            {{ editingProject ? '更新' : '创建' }}
          </NButton>
        </div>
      </template>
    </NModal>

    <NModal v-model:show="showDashboardModal" preset="card" title="新建看板" class="w-500px">
      <NForm :model="dashboardForm">
        <NFormItem label="看板名称" path="name">
          <NInput v-model:value="dashboardForm.name" placeholder="请输入看板名称" maxlength="50" show-count />
        </NFormItem>
        <NFormItem label="所属项目（可选）">
          <NSelect
            v-model:value="dashboardForm.projectId"
            clearable
            :options="projectOptions"
            placeholder="不选择时保存到默认项目"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showDashboardModal = false">取消</NButton>
          <NButton type="primary" :loading="dashboardCreating" @click="handleCreateDashboard">创建并编辑</NButton>
        </div>
      </template>
    </NModal>

    <!-- 删除项目确认弹窗 -->
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
      <template #default>确定删除项目"{{ pendingDeleteProject?.name }}"吗？该操作不可恢复。</template>
      <template #action>
        <NButton :disabled="!!deletingId" @click="deleteConfirmModal = false">取消</NButton>
        <NButton type="error" :loading="!!deletingId" @click="handleDeleteProject">确认删除</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.visualization-page-header {
  align-items: flex-start;
}

.visualization-filter-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 360px) auto auto auto;
  gap: 10px;
  align-items: center;
  justify-content: end;
  min-width: min(100%, 640px);
}

.visualization-filter-control {
  min-width: 0;

  &--search {
    min-width: 220px;
    width: 100%;
  }
}

.visualization-filter-toolbar :deep(.n-input),
.visualization-filter-toolbar :deep(.n-button) {
  height: 36px;
  border-radius: 8px;
}

.visualization-filter-toolbar :deep(.n-input) {
  min-height: 36px;
}

@media (max-width: 1024px) {
  .visualization-page-header {
    flex-direction: column;
  }

  .visualization-filter-toolbar {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .visualization-filter-toolbar {
    grid-template-columns: 1fr;
  }

  .visualization-filter-control--search {
    min-width: 0;
  }

  .visualization-filter-toolbar :deep(.n-button) {
    width: 100%;
  }
}
</style>
