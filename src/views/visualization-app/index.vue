<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NEmpty,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NModal,
  NSpin,
  useMessage
} from 'naive-ui'
import ThingsVisAppFrame from '@/components/thingsvis/ThingsVisAppFrame.vue'
import { bootstrapAppEmbedSession } from '@/utils/app-embed-auth'
import {
  createThingsVisProject,
  deleteThingsVisProject,
  getThingsVisDashboard,
  getThingsVisDashboards,
  getThingsVisProjects,
  updateThingsVisProject,
  type DashboardListItem,
  type ProjectListItem,
  type ThingsVisDashboard
} from '@/service/api/thingsvis'
import { deleteDashboardMenuConfig } from '@/service/api/dashboard-menu'
import { clearThingsVisHomeCache } from '@/utils/thingsvis/home-cache'

type AppView = 'projects' | 'dashboards' | 'preview'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const currentView = ref<AppView>('projects')
const loading = ref(false)
const authReady = ref(false)
const projects = ref<ProjectListItem[]>([])
const searchKeyword = ref('')
const dashboards = ref<DashboardListItem[]>([])
const selectedProject = ref<ProjectListItem | null>(null)
const selectedDashboardId = ref('')
const dashboardSchema = ref<ThingsVisDashboard | null>(null)
const showModal = ref(false)
const editingProject = ref<ProjectListItem | null>(null)
const deleteConfirmModal = ref(false)
const pendingDeleteProject = ref<{ id: string; name: string } | null>(null)
const deletingId = ref<string | null>(null)

const formData = ref({
  name: '',
  description: ''
})

const filteredProjects = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return projects.value

  return projects.value.filter(item => item.name.toLowerCase().includes(keyword))
})

const subPageTitle = computed(() => {
  if (currentView.value === 'preview') {
    return dashboardSchema.value?.name || '看板预览'
  }
  if (currentView.value === 'dashboards') {
    return selectedProject.value?.name || '看板列表'
  }
  return ''
})

async function fetchProjects() {
  loading.value = true
  try {
    const { data, error } = await getThingsVisProjects({ page: 1, limit: 100 })
    if (!error && data) {
      projects.value = data.data
    } else if (error) {
      message.error('加载项目失败')
    }
  } finally {
    loading.value = false
  }
}

async function fetchDashboards(projectId: string) {
  loading.value = true
  try {
    const { data, error } = await getThingsVisDashboards({
      projectId,
      page: 1,
      limit: 100
    })

    dashboards.value = !error && data ? data.data : []
  } finally {
    loading.value = false
  }
}

async function loadDashboardSchema(dashboardId: string) {
  if (!dashboardId) {
    dashboardSchema.value = null
    return
  }

  try {
    const { data, error } = await getThingsVisDashboard(dashboardId)
    dashboardSchema.value = !error ? data : null
  } catch (error) {
    console.warn('[visualization-app] 加载看板失败', error)
    dashboardSchema.value = null
  }
}

function openProject(project: ProjectListItem) {
  selectedProject.value = project
  currentView.value = 'dashboards'
  void fetchDashboards(project.id)
}

function openDashboard(dashboard: DashboardListItem) {
  selectedDashboardId.value = dashboard.id
  currentView.value = 'preview'
}

function openCreateModal() {
  editingProject.value = null
  formData.value = { name: '', description: '' }
  showModal.value = true
}

function openEditModal(project: ProjectListItem) {
  editingProject.value = project
  formData.value = {
    name: project.name,
    description: project.description || ''
  }
  showModal.value = true
}

async function handleSaveProject() {
  if (!formData.value.name.trim()) {
    message.error('请输入项目名称')
    return
  }

  try {
    if (editingProject.value) {
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
      return
    }

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
  } catch (error) {
    message.error('操作失败')
    console.error(error)
  }
}

function openDeleteConfirm(id: string, name: string) {
  const project = projects.value.find(item => item.id === id)
  if ((project?._count?.dashboards || 0) > 0) {
    message.warning('该项目下有仪表盘，无法删除。请先删除所有仪表盘。')
    return
  }

  pendingDeleteProject.value = { id, name }
  deleteConfirmModal.value = true
}

async function handleDeleteProject() {
  if (!pendingDeleteProject.value || deletingId.value) return

  deletingId.value = pendingDeleteProject.value.id
  try {
    const { id } = pendingDeleteProject.value
    const { data: dashboardsData } = await getThingsVisDashboards({
      projectId: id,
      page: 1,
      limit: 1000
    })
    const dashboardIds = (dashboardsData?.data || []).map((item: { id: string }) => item.id)

    for (const dashboardId of dashboardIds) {
      const { error } = await deleteDashboardMenuConfig(dashboardId)
      if (error) {
        message.error('删除失败：无法清理部分关联菜单')
        return
      }
    }

    const { error } = await deleteThingsVisProject(id)
    if (!error) {
      deleteConfirmModal.value = false
      pendingDeleteProject.value = null
      clearThingsVisHomeCache()
      message.success('删除成功')
      await fetchProjects()
    } else {
      message.error('删除失败')
    }
  } catch (error) {
    message.error('删除失败')
    console.error(error)
  } finally {
    deletingId.value = null
  }
}

function goBack() {
  if (currentView.value === 'preview') {
    currentView.value = selectedProject.value ? 'dashboards' : 'projects'
    selectedDashboardId.value = ''
    dashboardSchema.value = null
    return
  }

  if (currentView.value === 'dashboards') {
    currentView.value = 'projects'
    selectedProject.value = null
    dashboards.value = []
  }
}

watch(
  () => selectedDashboardId.value,
  dashboardId => {
    if (currentView.value === 'preview' && dashboardId) {
      void loadDashboardSchema(dashboardId)
    }
  },
  { immediate: true }
)

onMounted(async () => {
  const authenticated = await bootstrapAppEmbedSession({
    token: route.query.token,
    lang: route.query.lang
  })

  if (!authenticated) {
    await router.push({ name: 'login' })
    return
  }

  authReady.value = true
  await fetchProjects()
})
</script>

<template>
  <div class="visualization-app">
    <header v-if="currentView !== 'projects'" class="visualization-app__header">
      <button type="button" class="visualization-app__back" @click="goBack">返回</button>
      <h1 class="visualization-app__title">{{ subPageTitle }}</h1>
    </header>

    <main class="visualization-app__main">
      <NSpin :show="loading || !authReady">
        <section v-if="authReady && currentView === 'projects'" class="visualization-app__section">
          <div class="visualization-app__toolbar">
            <div class="visualization-app__toolbar-left">
              <h2 class="visualization-app__section-title">可视化项目</h2>
              <span class="visualization-app__count">{{ filteredProjects.length }} 个项目</span>
            </div>

            <NButton type="primary" size="small" @click="openCreateModal">
              <template #icon>
                <icon-mdi:plus />
              </template>
              新建项目
            </NButton>
          </div>

          <NInput
            v-model:value="searchKeyword"
            clearable
            placeholder="搜索项目名称..."
            class="visualization-app__search"
          >
            <template #prefix>
              <icon-mdi:magnify />
            </template>
          </NInput>

          <NEmpty
            v-if="!loading && filteredProjects.length === 0"
            description="暂无项目，点击上方按钮创建第一个项目"
            class="py-16"
          >
            <template #icon>
              <icon-mdi:folder-open-outline class="text-50px text-gray-300" />
            </template>
          </NEmpty>

          <NGrid v-else x-gap="16" y-gap="16" cols="1">
            <NGridItem v-for="project in filteredProjects" :key="project.id">
              <div class="visualization-app__project-card" @click="openProject(project)">
                <div class="visualization-app__project-top">
                  <div class="visualization-app__project-icon">
                    <icon-mdi:folder class="text-24px text-primary" />
                  </div>

                  <div class="visualization-app__project-actions">
                    <NButton size="tiny" quaternary circle @click.stop="openEditModal(project)">
                      <template #icon>
                        <icon-mdi:pencil class="text-16px" />
                      </template>
                    </NButton>
                    <NButton size="tiny" quaternary circle @click.stop="openDeleteConfirm(project.id, project.name)">
                      <template #icon>
                        <icon-mdi:delete class="text-16px" />
                      </template>
                    </NButton>
                  </div>
                </div>

                <h3 class="visualization-app__project-name">{{ project.name }}</h3>
                <p class="visualization-app__project-desc">
                  {{ project.description || '暂无描述' }}
                </p>

                <div class="visualization-app__project-meta">
                  <span>
                    <icon-mdi:chart-box-outline />
                    {{ project._count?.dashboards || 0 }} 个仪表盘
                  </span>
                  <span>
                    <icon-mdi:clock-outline />
                    {{ new Date(project.updatedAt).toLocaleDateString() }}
                  </span>
                </div>
              </div>
            </NGridItem>
          </NGrid>
        </section>

        <section v-else-if="authReady && currentView === 'dashboards'" class="visualization-app__section">
          <NEmpty v-if="!loading && dashboards.length === 0" description="该项目暂无看板" class="py-16" />

          <div v-else class="visualization-app__list">
            <button
              v-for="dashboard in dashboards"
              :key="dashboard.id"
              type="button"
              class="visualization-app__card"
              @click="openDashboard(dashboard)"
            >
              <strong>{{ dashboard.name }}</strong>
              <span>{{ dashboard.updatedAt ? new Date(dashboard.updatedAt).toLocaleDateString() : '' }}</span>
            </button>
          </div>
        </section>

        <section v-else-if="authReady" class="visualization-app__preview">
          <ThingsVisAppFrame
            v-if="selectedDashboardId"
            :id="selectedDashboardId"
            :schema="dashboardSchema"
            mode="viewer"
            auto-height
            class="visualization-app__frame"
          />
          <div v-else class="visualization-app__empty-preview">
            <p>无法加载看板</p>
            <NButton type="primary" @click="goBack">返回</NButton>
          </div>
        </section>
      </NSpin>
    </main>

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

<style scoped>
.visualization-app {
  min-height: 100vh;
  background: #f5f7fb;
}

.visualization-app__header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #eef0f4;
}

.visualization-app__back {
  border: none;
  background: transparent;
  color: #646cff;
  font-size: 14px;
}

.visualization-app__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.visualization-app__main {
  padding: 16px;
}

.visualization-app__section,
.visualization-app__preview {
  width: 100%;
}

.visualization-app__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.visualization-app__toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.visualization-app__section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.visualization-app__count {
  color: #9ca3af;
  font-size: 13px;
  white-space: nowrap;
}

.visualization-app__search {
  margin-bottom: 16px;
}

.visualization-app__project-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.visualization-app__project-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.visualization-app__project-icon {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgb(100 108 255 / 10%);
}

.visualization-app__project-actions {
  display: flex;
  gap: 4px;
}

.visualization-app__project-name {
  margin: 0 0 8px;
  overflow: hidden;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visualization-app__project-desc {
  display: -webkit-box;
  min-height: 40px;
  margin: 0 0 12px;
  overflow: hidden;
  color: #6b7280;
  font-size: 13px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.visualization-app__project-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #9ca3af;
  font-size: 12px;
}

.visualization-app__project-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.visualization-app__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.visualization-app__card {
  width: 100%;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  text-align: left;
}

.visualization-app__card strong {
  display: block;
  margin-bottom: 6px;
  color: #111827;
  font-size: 16px;
}

.visualization-app__card span {
  color: #6b7280;
  font-size: 13px;
}

.visualization-app__frame {
  width: 100%;
}

.visualization-app__empty-preview {
  display: flex;
  min-height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #9ca3af;
}
</style>
