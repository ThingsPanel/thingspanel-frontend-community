<template>
  <div class="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
    <!-- 卡片标题栏 -->
    <div class="flex items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
          <Icon icon="mdi:history" class="text-lg text-purple-600 dark:text-purple-400" />
        </div>
        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
          {{ $t('card.recentlyVisited.title') }}
        </h3>
      </div>
    </div>

    <!-- 访问记录列表 -->
    <div class="flex-1 p-4 overflow-hidden">
      <div v-if="visitedRoutes.length > 0" class="h-full overflow-y-auto scrollbar-thin">
        <div class="space-y-2">
          <div
            v-for="route in visitedRoutes"
            :key="route.path + JSON.stringify(route.query)"
            class="group flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 cursor-pointer transition-all duration-200 hover:shadow-sm"
            @click="navigateTo(route.path, route.query)"
          >
            <!-- 图标 -->
            <div class="flex-shrink-0 mr-3">
              <div v-if="route.icon" class="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <SvgIcon :icon="route.icon" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div v-else class="p-1.5 bg-gray-100 dark:bg-gray-600 rounded-md">
                <Icon icon="mdi:web" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>

            <!-- 标题和路径 -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {{ getRouteDisplayTitle(route) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {{ route.path }}{{ route.query && Object.keys(route.query).length ? '?' + new URLSearchParams(route.query as any).toString() : '' }}
              </div>
            </div>

            <!-- 箭头图标 -->
            <div class="flex-shrink-0 ml-2">
              <Icon
                icon="mdi:chevron-right"
                class="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else class="h-full flex flex-col items-center justify-center text-center">
        <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
          <Icon icon="mdi:clock-outline" class="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('card.recentlyVisited.noRecords') }}
        </div>
        <div class="text-xs text-gray-400 dark:text-gray-500">
          开始浏览页面以查看访问记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 最近访问组件
 * 显示用户最近访问的页面列表，支持快速导航
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, type LocationQuery } from 'vue-router'
import { Icon } from '@iconify/vue'
import { $t } from '@/locales'

interface VisitedRoute {
  path: string
  name: string | symbol | undefined
  title: string
  icon?: string
  i18nKey?: string
  query?: LocationQuery
}

const RECENTLY_VISITED_ROUTES_KEY = 'RECENTLY_VISITED_ROUTES'
const visitedRoutes = ref<VisitedRoute[]>([])
const router = useRouter()

/**
 * 加载访问记录
 */
const loadVisitedRoutes = () => {
  try {
    const routesRaw = localStorage.getItem(RECENTLY_VISITED_ROUTES_KEY)
    if (routesRaw) {
      visitedRoutes.value = JSON.parse(routesRaw)
    } else {
      visitedRoutes.value = []
    }
  } catch (error) {
    console.error('加载访问记录失败:', error)
    visitedRoutes.value = []
  }
}

/**
 * 导航到指定路由
 */
const navigateTo = (path: string, query?: LocationQuery) => {
  router.push({ path, query })
}

/**
 * 获取路由显示标题，优先使用国际化翻译
 */
const getRouteDisplayTitle = (route: VisitedRoute): string => {
  // 如果有i18nKey，则使用国际化翻译
  if (route.i18nKey) {
    try {
      return $t(route.i18nKey as App.I18n.I18nKey)
    } catch {
      // 如果翻译失败，fallback到原始title
      return route.title
    }
  }
  // 否则使用原始title作为fallback
  return route.title
}

/**
 * 监听存储变化
 */
const handleStorageChange = (event: StorageEvent) => {
  if (event.key === RECENTLY_VISITED_ROUTES_KEY) {
    loadVisitedRoutes()
  }
}

// 立即加载数据
loadVisitedRoutes()

onMounted(() => {
  // 监听 storage 事件，以便在其他标签页更新时刷新列表
  window.addEventListener('storage', handleStorageChange)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
})

defineOptions({
  name: 'RecentlyVisitedCard21'
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.300');
  border-radius: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.400');
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.600');
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.500');
}

.scrollbar-thin::-webkit-scrollbar-track {
  background-color: transparent;
}

/* 滚动条在火狐浏览器中的样式 */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.300') transparent;
}

.dark .scrollbar-thin {
  scrollbar-color: theme('colors.gray.600') transparent;
}
</style>