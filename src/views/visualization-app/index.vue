<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NEmpty, NInput, NSpin, useMessage } from 'naive-ui'
import ThingsVisAppFrame from '@/components/thingsvis/ThingsVisAppFrame.vue'
import { bootstrapAppEmbedSession } from '@/utils/app-embed-auth'
import {
  getThingsVisDashboard,
  getThingsVisDashboards,
  getThingsVisDashboardThumbnail,
  getThingsVisProjects,
  type DashboardListItem,
  type ProjectListItem,
  type ThingsVisDashboard
} from '@/service/api/thingsvis'

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
const selectedDashboardName = ref('')
const dashboardSchema = ref<ThingsVisDashboard | null>(null)

const filteredProjects = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return projects.value
  return projects.value.filter(item => item.name.toLowerCase().includes(keyword))
})

const navTitle = computed(() => {
  if (currentView.value === 'preview') {
    return selectedDashboardName.value || dashboardSchema.value?.name || '看板预览'
  }
  if (currentView.value === 'dashboards') {
    return selectedProject.value?.name || '看板列表'
  }
  return ''
})

const showSubNav = computed(() => currentView.value !== 'projects')

const headerTitle = computed(() => (showSubNav.value ? navTitle.value : '可视化'))

function pushViewState(view: AppView) {
  if (typeof window === 'undefined' || typeof window.history?.pushState !== 'function') return
  window.history.pushState({ view }, '')
}

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
    if (dashboards.value.length > 0) {
      void loadThumbnails(dashboards.value)
    }
  } finally {
    loading.value = false
  }
}

/** 处理缩略图 URL，与 PC 端保持一致 */
function getThumbnailUrl(thumbnail: string | null | undefined): string | null {
  if (!thumbnail) return null
  if (thumbnail.startsWith('data:')) return thumbnail
  if (thumbnail.startsWith('http')) return thumbnail
  return `data:image/png;base64,${thumbnail}`
}

/** 懒加载看板缩略图 */
async function loadThumbnails(list: DashboardListItem[]) {
  const CONCURRENCY = 5
  const queue = [...list]

  while (queue.length > 0) {
    const batch = queue.splice(0, CONCURRENCY)
    await Promise.all(
      batch.map(async item => {
        const hasValidThumbnail = item.thumbnail && item.thumbnail.trim().startsWith('data:')
        if (hasValidThumbnail) return

        try {
          const result = await getThingsVisDashboardThumbnail(item.id)
          const resultData = result.data as
            | { thumbnail?: string | null; data?: { thumbnail?: string | null } }
            | null
          const thumbnail = resultData?.thumbnail || resultData?.data?.thumbnail
          if (!thumbnail) return

          const target = dashboards.value.find(dashboard => dashboard.id === item.id)
          if (target) {
            target.thumbnail = thumbnail
          }
        } catch (error) {
          console.warn('[visualization-app] 加载缩略图失败', item.id, error)
        }
      })
    )
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
  pushViewState('dashboards')
  void fetchDashboards(project.id)
}

function openDashboard(dashboard: DashboardListItem) {
  selectedDashboardId.value = dashboard.id
  selectedDashboardName.value = dashboard.name
  currentView.value = 'preview'
  pushViewState('preview')
}

function resetToProjects() {
  currentView.value = 'projects'
  selectedProject.value = null
  selectedDashboardId.value = ''
  selectedDashboardName.value = ''
  dashboardSchema.value = null
  dashboards.value = []
}

function resetToDashboards() {
  currentView.value = 'dashboards'
  selectedDashboardId.value = ''
  selectedDashboardName.value = ''
  dashboardSchema.value = null
}

function goBack() {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    window.history.back()
    return
  }

  if (currentView.value === 'preview') {
    resetToDashboards()
    return
  }

  if (currentView.value === 'dashboards') {
    resetToProjects()
  }
}

function handlePopState(event: PopStateEvent) {
  const stateView = (event.state as { view?: AppView } | null)?.view

  if (stateView === 'dashboards' && currentView.value === 'preview') {
    resetToDashboards()
    return
  }

  if ((stateView === 'projects' || !stateView) && currentView.value !== 'projects') {
    resetToProjects()
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
  window.addEventListener('popstate', handlePopState)

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

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState)
})
</script>

<template>
  <div class="visualization-app">
    <header class="mobile-nav-bar" :class="{ 'mobile-nav-bar--root': !showSubNav }">
      <button
        v-if="showSubNav"
        type="button"
        class="mobile-nav-bar__back"
        aria-label="返回"
        @click="goBack"
      >
        <icon-mdi:chevron-left class="mobile-nav-bar__back-icon" />
      </button>
      <h1 class="mobile-nav-bar__title">{{ headerTitle }}</h1>
    </header>

    <main class="visualization-app__main visualization-app__main--sub">
      <NSpin :show="loading || !authReady">
        <section v-if="authReady && currentView === 'projects'" class="visualization-app__section">
          <div class="visualization-app__toolbar">
            <h2 class="visualization-app__section-title">可视化项目</h2>
            <span class="visualization-app__count">{{ filteredProjects.length }} 个项目</span>
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
            description="暂无可视化项目"
            class="py-16"
          >
            <template #icon>
              <icon-mdi:folder-open-outline class="text-50px text-gray-300" />
            </template>
          </NEmpty>

          <div v-else class="visualization-app__list">
            <button
              v-for="project in filteredProjects"
              :key="project.id"
              type="button"
              class="visualization-app__item-card"
              @click="openProject(project)"
            >
              <div class="visualization-app__item-icon">
                <icon-mdi:folder class="text-22px text-primary" />
              </div>
              <div class="visualization-app__item-body">
                <strong>{{ project.name }}</strong>
                <span>{{ project._count?.dashboards || 0 }} 个看板</span>
                <p v-if="project.description">{{ project.description }}</p>
              </div>
              <icon-mdi:chevron-right class="visualization-app__item-arrow" />
            </button>
          </div>
        </section>

        <section v-else-if="authReady && currentView === 'dashboards'" class="visualization-app__section">
          <NEmpty v-if="!loading && dashboards.length === 0" description="该项目暂无看板" class="py-16" />

          <div v-else class="visualization-app__dashboard-list">
            <button
              v-for="dashboard in dashboards"
              :key="dashboard.id"
              type="button"
              class="visualization-app__dashboard-card"
              @click="openDashboard(dashboard)"
            >
              <div class="visualization-app__dashboard-thumb">
                <img
                  v-if="getThumbnailUrl(dashboard.thumbnail)"
                  :src="getThumbnailUrl(dashboard.thumbnail) || undefined"
                  class="visualization-app__dashboard-image"
                  alt="看板预览"
                />
                <icon-mdi:chart-box v-else class="visualization-app__dashboard-placeholder" />
                <span v-if="dashboard.homeFlag" class="visualization-app__dashboard-home">首</span>
              </div>

              <div class="visualization-app__dashboard-info">
                <strong>{{ dashboard.name }}</strong>
                <span>{{ dashboard.updatedAt ? new Date(dashboard.updatedAt).toLocaleDateString() : '' }}</span>
              </div>
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
          <NEmpty v-else description="无法加载看板" class="py-16" />
        </section>
      </NSpin>
    </main>
  </div>
</template>

<style scoped>
.visualization-app {
  min-height: 100vh;
  background: #f5f7fb;
}

.mobile-nav-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: calc(44px + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  background: #fff;
  border-bottom: 1px solid #eee;
}

.mobile-nav-bar__back {
  position: absolute;
  top: env(safe-area-inset-top, 0px);
  left: 0;
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
}

.mobile-nav-bar__back-icon {
  font-size: 28px;
  color: #111;
}

.mobile-nav-bar__title {
  display: flex;
  height: 44px;
  align-items: center;
  justify-content: center;
  margin: 0;
  margin-top: env(safe-area-inset-top, 0px);
  padding: 0 52px;
  overflow: hidden;
  color: #111;
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-nav-bar--root .mobile-nav-bar__title {
  padding: 0 16px;
}

.visualization-app__main {
  padding: 16px;
}

.visualization-app__main--sub {
  padding-top: 12px;
}

.visualization-app__section,
.visualization-app__preview {
  width: 100%;
}

.visualization-app__toolbar {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
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
}

.visualization-app__search {
  margin-bottom: 16px;
}

.visualization-app__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.visualization-app__item-card {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: #fff;
  text-align: left;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.visualization-app__item-card--compact {
  align-items: center;
}

.visualization-app__item-icon {
  display: flex;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgb(100 108 255 / 10%);
}

.visualization-app__item-body {
  min-width: 0;
  flex: 1;
}

.visualization-app__item-body strong {
  display: block;
  overflow: hidden;
  margin-bottom: 4px;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visualization-app__item-body span,
.visualization-app__item-body p {
  color: #6b7280;
  font-size: 13px;
}

.visualization-app__item-body p {
  display: -webkit-box;
  margin: 6px 0 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.visualization-app__item-arrow {
  flex-shrink: 0;
  font-size: 20px;
  color: #c4c4c4;
}

.visualization-app__dashboard-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.visualization-app__dashboard-card {
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: none;
  border-radius: 12px;
  background: #fff;
  text-align: left;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.visualization-app__dashboard-thumb {
  position: relative;
  display: flex;
  height: 140px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, rgb(100 108 255 / 20%), rgb(100 108 255 / 5%));
}

.visualization-app__dashboard-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.visualization-app__dashboard-placeholder {
  font-size: 56px;
  color: rgb(100 108 255 / 40%);
}

.visualization-app__dashboard-home {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border: 2px solid #ef4444;
  border-radius: 999px;
  background: #fff;
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 1px 2px rgb(15 23 42 / 8%);
}

.visualization-app__dashboard-info {
  padding: 14px 16px 16px;
}

.visualization-app__dashboard-info strong {
  display: block;
  overflow: hidden;
  margin-bottom: 6px;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visualization-app__dashboard-info span {
  color: #9ca3af;
  font-size: 12px;
}

.visualization-app__frame {
  width: 100%;
}
</style>
