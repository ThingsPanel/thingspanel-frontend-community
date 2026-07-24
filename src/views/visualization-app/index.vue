<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NEmpty, NInput, NSpin, useMessage } from 'naive-ui'
import { bootstrapAppEmbedSession } from '@/utils/app-embed-auth'
import { openAppWebViewPage } from '@/utils/app-webview-bridge'
import { getThingsVisProjects, type ProjectListItem } from '@/service/api/thingsvis'
import EmbedNavBar from '@/views/visualization-app/EmbedNavBar.vue'
import { buildVisualizationAppUrl } from './shared'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const authReady = ref(false)
const projects = ref<ProjectListItem[]>([])
const searchKeyword = ref('')

const filteredProjects = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return projects.value
  return projects.value.filter(item => item.name.toLowerCase().includes(keyword))
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

async function openProject(project: ProjectListItem) {
  const pageUrl = buildVisualizationAppUrl('/visualization-app/dashboards', {
    projectId: project.id,
    projectName: project.name
  })

  await openAppWebViewPage(pageUrl, project.name, () => {
    router.push({
      path: '/visualization-app/dashboards',
      query: {
        projectId: project.id,
        projectName: project.name,
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
  await fetchProjects()
})
</script>

<template>
  <div class="visualization-app">
    <EmbedNavBar title="看板" :show-back="false" />
    <main class="visualization-app__main">
      <NSpin :show="loading || !authReady">
        <section v-if="authReady" class="visualization-app__section">
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

          <NEmpty v-if="!loading && filteredProjects.length === 0" description="暂无可视化项目" class="py-16">
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
      </NSpin>
    </main>
  </div>
</template>

<style scoped src="./styles.css"></style>
