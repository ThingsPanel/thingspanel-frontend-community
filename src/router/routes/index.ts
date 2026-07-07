import type { CustomRoute, ElegantConstRoute, ElegantRoute } from '@elegant-router/types'
import type { RouteComponent } from 'vue-router'
import { generatedRoutes } from '../elegant/routes'
import { layouts, views } from '../elegant/imports'
import { transformElegantRoutesToVueRoutes } from '../elegant/transform'

/** App 嵌入页视图：elegant-router 需独立目录 page，此处兜底注册避免 watcher 覆盖后找不到组件 */
const appEmbedViews: Record<string, RouteComponent | (() => Promise<RouteComponent>)> = {
  ...views,
  'visualization-app-dashboards': () => import('@/views/visualization-app-dashboards/index.vue'),
  'visualization-app-preview': () => import('@/views/visualization-app-preview/index.vue')
}

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
    name: 'device-config-legacy-redirect',
    path: '/device/config',
    redirect: '/device/template',
    meta: {
      title: 'device-config-legacy-redirect',
      constant: true
    }
  },
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
  },
  {
    name: 'device-details-app',
    path: '/device-details-app',
    component: 'layout.blank$view.device-details-app',
    meta: {
      title: 'device-details-app',
      i18nKey: 'route.device-details-app',
      constant: true
    }
  },
  {
    name: 'visualization-app',
    path: '/visualization-app',
    component: 'layout.blank$view.visualization-app',
    meta: {
      title: 'visualization-app',
      i18nKey: 'route.visualization-app',
      constant: true
    }
  },
  {
    name: 'visualization-app-dashboards',
    path: '/visualization-app/dashboards',
    component: 'layout.blank$view.visualization-app-dashboards',
    meta: {
      title: 'visualization-app-dashboards',
      i18nKey: 'route.visualization-app-dashboards',
      constant: true
    }
  },
  {
    name: 'visualization-app-preview',
    path: '/visualization-app/preview',
    component: 'layout.blank$view.visualization-app-preview',
    meta: {
      title: 'visualization-app-preview',
      i18nKey: 'route.visualization-app-preview',
      constant: true
    }
  }
]

// ThingsVis 预览页面 - 独立的常量路由，无需登录
// 使用 as any 绕过类型检查，因为这是新增的路由
const thingsvisPreviewRoute = {
  name: 'thingsvis-preview-standalone',
  path: '/tv-preview',
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

  const appEmbedRouteNames = new Set([
    'visualization-app',
    'visualization-app-dashboards',
    'visualization-app-preview'
  ])

  // 添加独立的常量路由
  constantRoutes.push(thingsvisPreviewRoute)

    ;[...customRoutes, ...generatedRoutes].forEach(item => {
      // App 嵌入页已在 customRoutes 中以 blank + constant 注册，跳过 generated 重复项
      if (appEmbedRouteNames.has(item.name) && !item.meta?.constant) {
        return
      }

      if (item.meta?.constant) {
        constantRoutes.push(item)
      } else {
        authRoutes.push(item)
      }
    })

  const constantVueRoutes = transformElegantRoutesToVueRoutes(constantRoutes, layouts, appEmbedViews)

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
  return transformElegantRoutesToVueRoutes(routes, layouts, appEmbedViews)
}
