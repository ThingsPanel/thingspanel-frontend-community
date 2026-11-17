import type { Router } from 'vue-router'
import { isStartupPending } from '@/plugins/loading'

export function createProgressGuard(router: Router) {
  router.beforeEach((_to, _from, next) => {
    if (!isStartupPending()) window.NProgress?.start?.()
    next()
  })
  router.afterEach(_to => {
    window.NProgress?.done?.()
  })
  router.onError(() => {
    window.NProgress?.done?.()
  })
}
