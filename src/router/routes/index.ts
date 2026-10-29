import type { CustomRoute, ElegantConstRoute, ElegantRoute } from '@elegant-router/types'
import type { RouteComponent, RouteRecordRaw } from 'vue-router'
import { generatedRoutes } from '../elegant/routes'
import { layouts, views } from '../elegant/imports'
import { transformElegantRoutesToVueRoutes } from '../elegant/transform'

/** App 嵌入页视图：elegant-router 需独立目录 page，此处兜底注册避免 watcher 覆盖后找不到组件 */
const appEmbedViews: Record<string, RouteComponent | (() => Promise<RouteComponent>)> = {
  ...views,
  'thingmodel-detail': () => import('@/components/thingmodel-detail.vue'),
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

// These native model detail routes are registered at runtime, but are not
// generated into RouteMap by elegant-router. Keep their route literals strict
// and adapt only at the existing runtime registration boundary below.
type AddedNativeDetailRoute =
  | {
      name: 'device-template-detail-reference'
      path: '/device/template/detail'
      component: 'layout.base$view.device_config-detail'
      meta: { title: 'device_config-detail'; i18nKey: 'route.device_config-detail' }
    }
  | {
      name: 'thingmodel-detail-custom'
      path: '/device/thingsmodel/detail'
      component: 'layout.base$view.thingmodel-detail'
      meta: { title: 'device_template_detail'; i18nKey: 'route.device_thingsmodel_detail' }
    }

const customRoutes: Array<CustomRoute | AddedNativeDetailRoute> = [
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
    name: 'device-config-detail-legacy-redirect',
    path: '/device/config-detail',
    redirect: '/device/template/detail',
    meta: {
      title: 'device-config-detail-legacy-redirect',
      constant: true
    }
  },
  {
    name: 'device-template-detail-reference',
    path: '/device/template/detail',
    component: 'layout.base$view.device_config-detail',
    meta: {
      title: 'device_config-detail',
      i18nKey: 'route.device_config-detail'
    }
  },
  {
    name: 'thingmodel-detail-custom',
    path: '/device/thingsmodel/detail',
    component: 'layout.base$view.thingmodel-detail',
    meta: {
      title: 'device_template_detail',
      i18nKey: 'route.device_thingsmodel_detail'
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
function createThingsvisPreviewRoute() {
  return {
    name: 'thingsvis-preview-standalone',
    path: '/tv-preview',
    component: 'layout.blank$view.visualization_thingsvis-preview',
    meta: {
      title: 'thingsvis-preview',
      constant: true
    }
  } as any
}

/** Create routes */
export function createRoutes() {
  const constantRoutes: ElegantRoute[] = []

  const authRoutes: ElegantRoute[] = []

  const appEmbedRouteNames = new Set(['visualization-app', 'visualization-app-dashboards', 'visualization-app-preview'])

  // 添加独立的常量路由
  constantRoutes.push(createThingsvisPreviewRoute())
  ;[...customRoutes, ...generatedRoutes].forEach(item => {
    // Dynamic native detail route literals are validated above, then adapted
    // here because the generated RouteMap intentionally does not include them.
    const route = item as ElegantRoute

    // App 嵌入页已在 customRoutes 中以 blank + constant 注册，跳过 generated 重复项
    if (appEmbedRouteNames.has(route.name) && !route.meta?.constant) {
      return
    }

    // Pre-register standalone detail references while keeping them protected by
    // the normal login and role guard (their meta.constant remains unset).
    if (
      route.meta?.constant ||
      item.name === 'thingmodel-detail-custom' ||
      item.name === 'device-template-detail-reference'
    ) {
      constantRoutes.push(route)
    } else {
      authRoutes.push(route)
    }
  })

  const constantVueRoutes = transformElegantRoutesToVueRoutes(constantRoutes, layouts, appEmbedViews)

  // These records have underscore names, which elegant-router treats as nested
  // route keys and cannot convert from `layout.base$view.*` as a standalone
  // route. Register them with the base layout explicitly so cold-start URLs
  // resolve before authenticated menu routes are installed. Vue Router replaces
  // same-name child records when the authenticated tree is added.
  const protectedPreRegisteredRoutes: RouteRecordRaw[] = [
    {
      path: '/device/details',
      component: layouts.base,
      children: [
        {
          path: '',
          name: 'device_details',
          component: views.device_details,
          meta: { title: 'device_details', i18nKey: 'route.device_details' }
        }
      ]
    },
    {
      path: '/automation/rule-edit',
      component: layouts.base,
      children: [
        {
          path: '',
          name: 'automation_rule-edit',
          component: views['automation_rule-edit'],
          meta: { title: 'automation_rule-edit', i18nKey: 'route.automation_rule-edit', roles: ['TENANT_ADMIN'] }
        }
      ]
    },
    {
      path: '/automation/rule-manage',
      component: layouts.base,
      children: [
        {
          path: '',
          name: 'automation_rule-manage',
          component: views['automation_rule-manage'],
          meta: { title: 'automation_rule-manage', i18nKey: 'route.automation_rule-manage', roles: ['TENANT_ADMIN'] }
        }
      ]
    }
  ]

  return {
    constantVueRoutes: [...constantVueRoutes, ...protectedPreRegisteredRoutes],
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
