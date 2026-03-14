import { router } from '@/router'
import { useRouteStore } from '@/store/modules/route'

export async function refreshAuthRoutes(fullPath?: string) {
  const routeStore = useRouteStore()
  const targetPath = fullPath || router.currentRoute.value.fullPath

  await routeStore.resetStore()
  const success = await routeStore.initAuthRoute()

  if (success) {
    await router.replace(targetPath)
  }

  return success
}
