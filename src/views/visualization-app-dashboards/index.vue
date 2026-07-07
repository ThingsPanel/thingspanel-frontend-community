<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NEmpty, NSpin, useMessage } from 'naive-ui'
import { bootstrapAppEmbedSession } from '@/utils/app-embed-auth'
import { openAppWebViewPage } from '@/utils/app-webview-bridge'
import {
  getThingsVisDashboards,
  getThingsVisDashboardThumbnail,
  type DashboardListItem
} from '@/service/api/thingsvis'
import { buildVisualizationAppUrl, getThumbnailUrl } from '@/views/visualization-app/shared'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const authReady = ref(false)
const dashboards = ref<DashboardListItem[]>([])

const projectId = computed(() => String(route.query.projectId || ''))

async function fetchDashboards() {
  if (!projectId.value) {
    message.error('缺少项目 ID')
    return
  }

  loading.value = true
  try {
    const { data, error } = await getThingsVisDashboards({
      projectId: projectId.value,
      page: 1,
      limit: 100
    })
    dashboards.value = !error && data ? data.data : []
    if (dashboards.value.length > 0) {
      void loadThumbnails(dashboards.value)
    } else if (error) {
      message.error('加载看板失败')
    }
  } finally {
    loading.value = false
  }
}

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
          if (target) target.thumbnail = thumbnail
        } catch (error) {
          console.warn('[visualization-app] 加载缩略图失败', item.id, error)
        }
      })
    )
  }
}

async function openDashboard(dashboard: DashboardListItem) {
  const pageUrl = buildVisualizationAppUrl('/visualization-app/preview', {
    dashboardId: dashboard.id,
    projectId: projectId.value
  })

  await openAppWebViewPage(pageUrl, dashboard.name, () => {
    router.push({
      path: '/visualization-app/preview',
      query: {
        dashboardId: dashboard.id,
        projectId: projectId.value,
        token: route.query.token as string,
        lang: route.query.lang as string
      }
    })
  })
}

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
  await fetchDashboards()
})
</script>

<template>
  <div class="visualization-app">
    <main class="visualization-app__main">
      <NSpin :show="loading || !authReady">
        <section v-if="authReady" class="visualization-app__section">
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
      </NSpin>
    </main>
  </div>
</template>

<style scoped src="@/views/visualization-app/styles.css"></style>
