/** 用于恢复页面参数 */
import { useRoute } from 'vue-router'

const queryCache = new Map<string, Record<string, any>>()
export const usePageCache = () => {
  const route = useRoute()
  return {
    cache: {
      ...queryCache.get(route.path)
    } as Record<string, any>,
    setCache: (data: Record<string, any>) => {
      queryCache.set(route.path, {
        ...queryCache.get(route.path),
        ...data
      })
    }
  }
}
