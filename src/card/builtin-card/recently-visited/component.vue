<template>
  <div class="p-4 h-full bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
    <h3 class="text-base font-semibold mb-3 text-gray-800 dark:text-gray-100 flex-shrink-0">
      {{ $t('card.recentlyVisited.title') }}
    </h3>
    <div class="flex-grow overflow-hidden">
      <ul class="space-y-1.5 overflow-y-auto h-full pr-1">
        <li
          v-for="route in visitedRoutes"
          :key="route.path + JSON.stringify(route.query)"
          class="flex items-center cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors duration-150"
          @click="navigateTo(route.path, route.query)"
        >
          <SvgIcon v-if="route.icon" :icon="route.icon" class="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
          <span v-else class="w-5 h-5 mr-3 flex-shrink-0"></span>
          <span class="text-sm text-gray-700 dark:text-gray-300 truncate mr-2">{{ getRouteDisplayTitle(route) }}</span>
          <span class="ml-auto text-gray-400 dark:text-gray-500 text-xs">></span>
        </li>
        <li v-if="!visitedRoutes.length" class="text-sm text-gray-500 dark:text-gray-400 px-2 py-4 text-center">
          {{ $t('card.recentlyVisited.noRecords') }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, type LocationQuery } from 'vue-router'
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

const loadVisitedRoutes = () => {
  try {
    const routesRaw = localStorage.getItem(RECENTLY_VISITED_ROUTES_KEY)
    if (process.env.NODE_ENV === 'development') {
    }

    if (routesRaw) {
      visitedRoutes.value = JSON.parse(routesRaw)
    } else {
      visitedRoutes.value = []
    }
  } catch (error) {
    visitedRoutes.value = []
  }
}

// 在 setup 阶段立即调用一次以加载初始数据
loadVisitedRoutes()

const navigateTo = (path: string, query?: LocationQuery) => {
  router.push({ path, query })
}

// 获取路由显示标题，优先使用国际化翻译
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

onMounted(() => {
  // 监听 storage 事件，以便在其他标签页更新时刷新列表
  window.addEventListener('storage', event => {
    if (event.key === RECENTLY_VISITED_ROUTES_KEY) {
      loadVisitedRoutes()
    }
  })
})

// 组件卸载时移除监听器（虽然对于仪表盘卡片可能不是必须的）
// import { onUnmounted } from 'vue';
// onUnmounted(() => {
//   window.removeEventListener('storage', loadVisitedRoutes);
// });
</script>

<style scoped>
/* 可以在这里添加更精细的滚动条样式（可选） */
ul::-webkit-scrollbar {
  width: 4px;
}

ul::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 4px;
}

ul::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>
