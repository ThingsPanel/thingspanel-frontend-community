import type { CustomRoute, ElegantConstRoute, ElegantRoute } from '@elegant-router/types'
import { generatedRoutes } from '../elegant/routes'
import { layouts, views } from '../elegant/imports'
import { transformElegantRoutesToVueRoutes } from '../elegant/transform'

export const ROOT_ROUTE: CustomRoute = {
  name: 'root',
  path: '/',
  redirect: '/home',
  meta: {
    title: 'root',
    constant: true
  }
}

const customRoutes: CustomRoute[] = [
  ROOT_ROUTE,
  {
    name: 'not-found',
    path: '/:pathMatch(.*)*',
    component: 'layout.blank$view.404',
    meta: {
      title: 'not-found',
      constant: true
    }
  },
  {
    name: 'exception',
    path: '/exception',
    component: 'layout.base',
    meta: {
      title: 'exception',
      i18nKey: 'route.exception',
      icon: 'ant-design:exception-outlined',
      order: 7
    },
    children: [
      {
        name: 'exception_403',
        path: '/exception/403',
        component: 'view.403',
        meta: {
          title: 'exception_403',
          i18nKey: 'route.exception_403',
          icon: 'ic:baseline-block'
        }
      },
      {
        name: 'exception_404',
        path: '/exception/404',
        component: 'view.404',
        meta: {
          title: 'exception_404',
          i18nKey: 'route.exception_404',
          icon: 'ic:baseline-web-asset-off'
        }
      },
      {
        name: 'exception_500',
        path: '/exception/500',
        component: 'view.500',
        meta: {
          title: 'exception_500',
          i18nKey: 'route.exception_500',
          icon: 'ic:baseline-wifi-off'
        }
      }
    ]
  }
]

// ThingsVis 预览页面 - 独立的常量路由，无需登录
// 使用 as any 绕过类型检查，因为这是新增的路由
const thingsvisPreviewRoute = {
  name: 'thingsvis-preview-standalone',
  path: '/thingsvis-preview',
  component: 'layout.blank$view.visualization_thingsvis-preview',
  meta: {
    title: 'thingsvis-preview',
    constant: true
  }
} as any

/** Create routes */
export function createRoutes() {
  const constantRoutes: ElegantRoute[] = []

  const authRoutes: ElegantRoute[] = []

  // 添加独立的常量路由
  constantRoutes.push(thingsvisPreviewRoute)

  ;[...customRoutes, ...generatedRoutes].forEach(item => {
    if (item.meta?.constant) {
      constantRoutes.push(item)
    } else {
      authRoutes.push(item)
    }
  })

  const constantVueRoutes = transformElegantRoutesToVueRoutes(constantRoutes, layouts, views)

  return {
    constantVueRoutes,
    authRoutes
  }
}

/**
 * Get auth vue routes
 *
 * @param routes Elegant routes
 */
export function getAuthVueRoutes(routes: ElegantConstRoute[]) {
  return transformElegantRoutesToVueRoutes(routes, layouts, views)
}
