import type { Router } from 'vue-router'
import { useTitle } from '@vueuse/core'
import { $t } from '@/locales'

export function createDocumentTitleGuard(router: Router) {
  router.afterEach(to => {
    const { i18nKey, title } = to.meta
    const appTitle = import.meta.env.VITE_APP_TITLE
    let routeTitle = ''

    // 处理登录页面的子路由
    if (to.path?.startsWith('/login/')) {
      const path = to.path.split('/').pop()?.toLowerCase()
      switch (path) {
        case 'register-email':
          routeTitle = '注册'
          break
        case 'reset-pwd':
          routeTitle = '重置密码'
          break
        case 'code-login':
          routeTitle = '验证码登录'
          break
        default:
          routeTitle = '密码登录'
      }
    } else {
      // 其他路由的处理
      routeTitle = i18nKey ? '文本' : title
    }

    // 组合完整标题：应用标题 - 路由标题
    const documentTitle = routeTitle ? `${appTitle} - ${routeTitle}` : appTitle

    useTitle(documentTitle)
  })
}
