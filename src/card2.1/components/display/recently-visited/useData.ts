import { ref, onMounted, onUnmounted } from 'vue'
import { $t } from '@/locales'

interface VisitedRoute {
  path: string
  name: string | symbol | undefined
  title: string
  icon?: string
  i18nKey?: string
  query?: Record<string, any>
}

const RECENTLY_VISITED_ROUTES_KEY = 'RECENTLY_VISITED_ROUTES'

export function useData() {
  const visitedRoutes = ref<VisitedRoute[]>([])

  const loadVisitedRoutes = () => {
    try {
      const routesRaw = localStorage.getItem(RECENTLY_VISITED_ROUTES_KEY)
      visitedRoutes.value = routesRaw ? JSON.parse(routesRaw) : []
    } catch (error) {
      visitedRoutes.value = []
    }
  }

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === RECENTLY_VISITED_ROUTES_KEY) {
      loadVisitedRoutes()
    }
  }

  const getRouteDisplayTitle = (route: VisitedRoute): string => {
    if (route.i18nKey) {
      try {
        return $t(route.i18nKey as App.I18n.I18nKey)
      } catch {
        return route.title
      }
    }
    return route.title
  }

  onMounted(() => {
    loadVisitedRoutes()
    window.addEventListener('storage', handleStorageChange)
  })

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange)
  })

  return { visitedRoutes, getRouteDisplayTitle }
}
