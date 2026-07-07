<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NEmpty, NSpin } from 'naive-ui'
import ThingsVisAppFrame from '@/components/thingsvis/ThingsVisAppFrame.vue'
import { setLocale } from '@/locales'
import { localStg } from '@/utils/storage'
import {
  getThingsVisDashboard,
  getThingsVisDashboards,
  getThingsVisHomeDashboard,
  getThingsVisProjects,
  type DashboardListItem,
  type ProjectListItem,
  type ThingsVisDashboard
} from '@/service/api/thingsvis'

type AppView = 'projects' | 'dashboards' | 'preview'

const route = useRoute()
const router = useRouter()

const { token, lang } = route.query

if (token) {
  localStg.set('token', token as string)

  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.has('token')) {
    searchParams.delete('token')
    const nextQuery = searchParams.toString()
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', nextUrl)
  }
}

if (!localStg.get('token')) {
  router.push({ name: 'login' })
}

if (lang) {
  setLocale(lang as App.I18n.LangType)
}

const currentView = ref<AppView>('projects')
const loading = ref(false)
const projects = ref<ProjectListItem[]>([])
const dashboards = ref<DashboardListItem[]>([])
const selectedProject = ref<ProjectListItem | null>(null)
const selectedDashboardId = ref('')
const dashboardSchema = ref<ThingsVisDashboard | null>(null)
const homeDashboard = ref<{ id: string; name: string } | null>(null)

const pageTitle = computed(() => {
  if (currentView.value === 'preview') {
    return dashboardSchema.value?.name || '看板预览'
  }
  if (currentView.value === 'dashboards') {
    return selectedProject.value?.name || '看板列表'
  }
  return '可视化'
})

async function fetchProjects() {
  loading.value = true
  try {
    const [projectResult, homeResult] = await Promise.all([
      getThingsVisProjects({ page: 1, limit: 100 }),
      getThingsVisHomeDashboard()
    ])

    if (!projectResult.error && projectResult.data) {
      projects.value = projectResult.data.data
    }

    const home = homeResult.data?.data
    if (home?.id) {
      homeDashboard.value = {
        id: home.id,
        name: home.name || '首页看板'
      }
    } else {
      homeDashboard.value = null
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

function openHomeDashboard() {
  if (!homeDashboard.value) return
  selectedProject.value = null
  selectedDashboardId.value = homeDashboard.value.id
  currentView.value = 'preview'
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
  (dashboardId) => {
    if (currentView.value === 'preview' && dashboardId) {
      void loadDashboardSchema(dashboardId)
    }
  },
  { immediate: true }
)

void fetchProjects()
</script>

<template>
  <div class="visualization-app">
    <header class="visualization-app__header">
      <button
        v-if="currentView !== 'projects'"
        type="button"
        class="visualization-app__back"
        @click="goBack"
      >
        返回
      </button>
      <h1 class="visualization-app__title">{{ pageTitle }}</h1>
    </header>

    <main class="visualization-app__main">
      <NSpin :show="loading">
        <section v-if="currentView === 'projects'" class="visualization-app__section">
          <button
            v-if="homeDashboard"
            type="button"
            class="visualization-app__home-card"
            @click="openHomeDashboard"
          >
            <span class="visualization-app__card-label">首页看板</span>
            <strong>{{ homeDashboard.name }}</strong>
          </button>

          <NEmpty v-if="!loading && projects.length === 0" description="暂无可视化项目" class="py-16" />

          <div v-else class="visualization-app__list">
            <button
              v-for="project in projects"
              :key="project.id"
              type="button"
              class="visualization-app__card"
              @click="openProject(project)"
            >
              <strong>{{ project.name }}</strong>
              <span>{{ project._count?.dashboards || 0 }} 个看板</span>
              <p v-if="project.description">{{ project.description }}</p>
            </button>
          </div>
        </section>

        <section v-else-if="currentView === 'dashboards'" class="visualization-app__section">
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

        <section v-else class="visualization-app__preview">
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
  font-size: 18px;
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

.visualization-app__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.visualization-app__home-card,
.visualization-app__card {
  width: 100%;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  text-align: left;
}

.visualization-app__home-card {
  margin-bottom: 16px;
  border-color: #646cff;
  background: #f5f7ff;
}

.visualization-app__card-label {
  display: block;
  margin-bottom: 6px;
  color: #646cff;
  font-size: 12px;
}

.visualization-app__card strong {
  display: block;
  margin-bottom: 6px;
  color: #111827;
  font-size: 16px;
}

.visualization-app__card span,
.visualization-app__card p {
  color: #6b7280;
  font-size: 13px;
}

.visualization-app__card p {
  margin: 8px 0 0;
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
