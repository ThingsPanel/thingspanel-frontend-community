<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NEmpty, NSpin } from 'naive-ui'
import ThingsVisAppFrame from '@/components/thingsvis/ThingsVisAppFrame.vue'
import { bootstrapAppEmbedSession } from '@/utils/app-embed-auth'
import { getThingsVisDashboard, type ThingsVisDashboard } from '@/service/api/thingsvis'
import EmbedNavBar from '@/views/visualization-app/EmbedNavBar.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const authReady = ref(false)
const dashboardSchema = ref<ThingsVisDashboard | null>(null)

const dashboardId = computed(() => String(route.query.dashboardId || ''))
const pageTitle = computed(
  () => dashboardSchema.value?.name || String(route.query.dashboardName || '看板预览')
)

async function loadDashboardSchema() {
  if (!dashboardId.value) {
    dashboardSchema.value = null
    return
  }

  loading.value = true
  try {
    const { data, error } = await getThingsVisDashboard(dashboardId.value)
    dashboardSchema.value =
      !error && data
        ? {
            ...data,
            canvasConfig: {
              ...data.canvasConfig,
              previewAlignY: 'top'
            }
          }
        : null
  } catch (error) {
    console.warn('[visualization-app] 加载看板失败', error)
    dashboardSchema.value = null
  } finally {
    loading.value = false
  }
}

watch(dashboardId, () => {
  void loadDashboardSchema()
})

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
  await loadDashboardSchema()
})
</script>

<template>
  <div class="visualization-app visualization-app--embed">
    <EmbedNavBar :title="pageTitle" rotatable />
    <main class="visualization-app__main visualization-app__main--flat">
      <NSpin :show="loading || !authReady">
        <section v-if="authReady" class="visualization-app__preview">
          <ThingsVisAppFrame
            v-if="dashboardId"
            :id="dashboardId"
            :schema="dashboardSchema"
            mode="viewer"
            class="visualization-app__frame"
          />
          <NEmpty v-else description="无法加载看板" class="py-16" />
        </section>
      </NSpin>
    </main>
  </div>
</template>

<style scoped src="@/views/visualization-app/styles.css"></style>
