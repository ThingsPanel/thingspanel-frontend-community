<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NEmpty, NInput, NSpin } from 'naive-ui'
import { bootstrapAppEmbedSession } from '@/utils/app-embed-auth'
import { openAppWebViewPage } from '@/utils/app-webview-bridge'
import { getThingsVisDashboards, getThingsVisDashboardThumbnail, type DashboardListItem } from '@/service/api/thingsvis'
import { buildVisualizationAppUrl, getThumbnailUrl } from './shared'
import EmbedNavBar from './EmbedNavBar.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const loadingMore = ref(false)
const authReady = ref(false)
const dashboards = ref<DashboardListItem[]>([])
const keyword = ref('')
const total = ref(0)
const page = ref(0)
const totalPages = ref(0)
const errorMessage = ref('')
let requestId = 0
let listGeneration = 0
let disposed = false
let searchTimer: ReturnType<typeof setTimeout> | undefined

async function fetchDashboards(reset = true) {
  if (!authReady.value || (!reset && (loading.value || loadingMore.value || page.value >= totalPages.value))) return
  clearTimeout(searchTimer)
  const request = ++requestId
  const nextPage = reset ? 1 : page.value + 1
  loading.value = reset
  loadingMore.value = !reset
  errorMessage.value = ''
  if (reset) {
    ++listGeneration
    dashboards.value = []
    page.value = 0
    total.value = 0
    totalPages.value = 0
  }
  try {
    const { data, error } = await getThingsVisDashboards({
      page: nextPage,
      limit: 20,
      keyword: keyword.value.trim() || undefined
    })
    if (disposed || request !== requestId) return
    if (error || !data) throw new Error(error?.message || '加载看板失败')
    dashboards.value = [...new Map([...dashboards.value, ...data.data].map((item) => [item.id, item])).values()]
    page.value = nextPage
    total.value = data.meta.total
    totalPages.value = data.meta.totalPages
    void loadThumbnails(data.data, listGeneration)
  } catch (error) {
    if (!disposed && request === requestId) errorMessage.value = error instanceof Error ? error.message : '加载看板失败'
  } finally {
    if (!disposed && request === requestId) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

async function loadThumbnails(list: DashboardListItem[], generation: number) {
  const queue = [...list]
  while (queue.length && !disposed && generation === listGeneration) {
    await Promise.all(
      queue.splice(0, 4).map(async (item) => {
        if (getThumbnailUrl(item.thumbnail)) return
        try {
          const result = await getThingsVisDashboardThumbnail(item.id)
          const resultData = result.data as { thumbnail?: string | null; data?: { thumbnail?: string | null } } | null
          const thumbnail = resultData?.thumbnail || resultData?.data?.thumbnail
          const target = dashboards.value.find((dashboard) => dashboard.id === item.id)
          if (target && thumbnail && !disposed && generation === listGeneration) target.thumbnail = thumbnail
        } catch {
          /* A missing thumbnail must not block a dashboard. */
        }
      })
    )
  }
}

async function openDashboard(dashboard: DashboardListItem) {
  const params = { dashboardId: dashboard.id, dashboardName: dashboard.name }
  await openAppWebViewPage(buildVisualizationAppUrl('/visualization-app/preview', params), dashboard.name, () => {
    void router.push({
      path: '/visualization-app/preview',
      query: {
        ...params,
        token: route.query.token,
        lang: route.query.lang,
        statusBarHeight: route.query.statusBarHeight
      }
    })
  })
}

watch(keyword, () => {
  ++requestId
  ++listGeneration
  clearTimeout(searchTimer)
  loading.value = true
  loadingMore.value = false
  dashboards.value = []
  searchTimer = setTimeout(() => void fetchDashboards(), 300)
})

onMounted(async () => {
  const authenticated = await bootstrapAppEmbedSession({ token: route.query.token, lang: route.query.lang })
  if (disposed) return
  if (!authenticated) {
    await router.push({ name: 'login' })
    return
  }
  authReady.value = true
  await fetchDashboards()
})
onBeforeUnmount(() => {
  disposed = true
  ++requestId
  clearTimeout(searchTimer)
})
</script>

<template>
  <div class="visualization-app">
    <EmbedNavBar title="看板" :show-back="false" />
    <main class="visualization-app__main">
      <NInput
        v-model:value="keyword"
        clearable
        placeholder="搜索看板名称"
        aria-label="搜索看板名称"
        class="visualization-app__search"
      />
      <p class="mb-4 text-sm text-gray-500">{{ keyword.trim() ? '搜索结果' : '全部看板' }} · {{ total }}</p>
      <NSpin :show="loading || !authReady">
        <section v-if="authReady" class="visualization-app__section">
          <NEmpty
            v-if="!loading && !errorMessage && !dashboards.length"
            :description="keyword.trim() ? '没有匹配的看板' : '暂无看板'"
            class="py-16"
          />
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
                  loading="lazy"
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
          <div v-if="errorMessage && !loading" class="py-6 text-center" role="alert">
            <p class="mb-3">{{ errorMessage }}</p>
            <NButton @click="fetchDashboards(page === 0)">重试</NButton>
          </div>
          <NButton
            v-else-if="page < totalPages"
            block
            class="mt-4 min-h-44px"
            :loading="loadingMore"
            :disabled="loading"
            @click="fetchDashboards(false)"
          >
            加载更多
          </NButton>
        </section>
      </NSpin>
    </main>
  </div>
</template>

<style scoped src="./styles.css"></style>
