import type { ElegantRoute } from '@elegant-router/types'
import type { ElegantConstRoute } from '@elegant-router/vue'
import { layouts, views } from '@/router/elegant/imports'
import { getRouteName } from '@/router/elegant/transform'

/**
 * 递归处理菜单树数据
 *
 * @param treeNode
 */
function processTree(treeNode: Api.Route.MenuRoute): void {
  treeNode.authority = treeNode.authority ? JSON.parse(treeNode.authority) : []

  if (treeNode.children) {
    for (const childNode of treeNode.children) {
      processTree(childNode)
    }
  }
}

export function adapterOfFetchRouterList(data: Api.Route.Data): Api.Route.MenuRoute[] {
  if (!data?.list) return []

  return data.list.map(item => {
    processTree(item)
    return item
  })
}

const LAYOUT_PREFIX = 'layout.'
const VIEW_PREFIX = 'view.'
const FIRST_LEVEL_ROUTE_COMPONENT_SPLIT = '$'

function transformLayoutAndPageToComponent(layout: string, page: string | null) {
  const hasLayout = Boolean(layout)
  const hasPage = Boolean(page)

  if (hasLayout && hasPage) {
    return `${LAYOUT_PREFIX}${layout}${FIRST_LEVEL_ROUTE_COMPONENT_SPLIT}${VIEW_PREFIX}${page}`
  }

  if (hasLayout) {
    return `${LAYOUT_PREFIX}${layout}`
  }

  if (hasPage) {
    return `${VIEW_PREFIX}${page}`
  }

  return ''
}

function normalizePath(path?: string | null) {
  if (!path) return ''

  const trimmedPath = path.trim()

  if (!trimmedPath) return ''

  return trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`
}

function isKnownLayout(layoutName?: string | null) {
  if (!layoutName) return false

  return Object.prototype.hasOwnProperty.call(layouts, layoutName)
}

function isKnownView(viewName?: string | null) {
  if (!viewName) return false

  return Object.prototype.hasOwnProperty.call(views, viewName)
}

function resolveViewName(rawViewName?: string | null) {
  if (!rawViewName) return null

  const normalizedViewName = rawViewName.trim()

  if (!normalizedViewName) return null

  const candidates = [
    normalizedViewName,
    normalizedViewName.replace(/\s+/g, '_'),
    normalizedViewName.replace(/\s+/g, '-'),
    normalizedViewName.split(/\s+/).at(-1) || ''
  ]

  return candidates.find(candidate => isKnownView(candidate)) || null
}

function resolveExplicitComponent(routePath?: string | null) {
  if (!routePath) return null

  const normalizedRoutePath = routePath.trim()

  if (!normalizedRoutePath) return null

  if (normalizedRoutePath.includes('$view.')) {
    const [layoutPart, rawViewName] = normalizedRoutePath.split('$view.')
    const layoutName = layoutPart.replace(/^layout\./, '').trim()
    const viewName = resolveViewName(rawViewName)

    if (isKnownLayout(layoutName) && viewName) {
      return `layout.${layoutName}$view.${viewName}`
    }

    return null
  }

  if (normalizedRoutePath.startsWith(VIEW_PREFIX)) {
    const viewName = resolveViewName(normalizedRoutePath.replace(/^view\./, ''))

    if (viewName) {
      return `view.${viewName}`
    }

    return null
  }

  if (normalizedRoutePath.startsWith(LAYOUT_PREFIX)) {
    const layoutName = normalizedRoutePath.replace(/^layout\./, '').trim()

    if (isKnownLayout(layoutName)) {
      return `layout.${layoutName}`
    }
  }

  return null
}

function resolveViewNameByPath(path?: string | null) {
  const normalizedPath = normalizePath(path)

  if (!normalizedPath) return null

  const exactMatch = getRouteName(normalizedPath as never)

  if (isKnownView(exactMatch)) {
    return exactMatch
  }

  const lastPathSegment = normalizedPath.split('/').filter(Boolean).at(-1)

  if (!lastPathSegment) return null

  const lastSegmentMatch = getRouteName(`/${lastPathSegment}` as never)

  if (isKnownView(lastSegmentMatch)) {
    return lastSegmentMatch
  }

  return null
}

function getRouteComponent(item: Api.Route.MenuRoute) {
  const explicitComponent = resolveExplicitComponent(item.route_path)

  if (explicitComponent) {
    return explicitComponent
  }

  const viewName = resolveViewNameByPath(item.param1)

  if (item.parent_id === '0') {
    return transformLayoutAndPageToComponent('base', item.element_type === 1 ? null : viewName)
  }

  return transformLayoutAndPageToComponent(
    item.element_type === 1 ? 'base' : '',
    item.element_type === 1 ? null : viewName
  )
}

function createHomeDefaultChild(item: Api.Route.MenuRoute): ElegantRoute {
  return {
    name: 'home_overview',
    path: '',
    component: 'view.home',
    meta: {
      title: item.description,
      i18nKey: item.multilingual,
      requiresAuth: true,
      permissions: [],
      roles: [],
      icon: item.param2,
      order: item.orders,
      hideInMenu: true,
      activeMenu: 'home',
      remark: item.remark || ''
    }
  } as unknown as ElegantRoute
}

/** 递归转换后端菜单数据为前端路由 */
function replaceKeys(data: ElegantConstRoute[]): ElegantRoute[] {
  return data.flatMap((item: any): ElegantRoute[] => {
    const component = getRouteComponent(item)
    const children = item.children?.length ? replaceKeys(item.children) : []
    const path = normalizePath(item.param1)

    const route: Partial<ElegantRoute> = {
      name: item.element_code.trim().replace(/\s/g, '_'),
      path,
      ...(component && { component }),
      meta: {
        title: item.description,
        i18nKey: item.multilingual,
        requiresAuth: true,
        permissions: [],
        roles: [],
        icon: item.param2,
        order: item.orders,
        hideInMenu: item.param3 === '1',
        remark: item.remark || ''
      },
      children
    }

    if (item.element_code === 'home' && children.length) {
      route.component = 'layout.base'
      route.children = [createHomeDefaultChild(item), ...children]
    }

    const hasChildren = Boolean(route.children?.length)
    const hasComponent = Boolean(route.component)

    if (!hasChildren && !hasComponent) {
      console.warn('[route-adapter] skip invalid menu route:', {
        elementCode: item.element_code,
        path: item.param1,
        routePath: item.route_path
      })
      return []
    }

    return [route as ElegantRoute]
  })
}

export function adapterOfFetchUserRouterList(data: ElegantConstRoute[] | null | undefined): ElegantConstRoute[] {
  if (!data?.length) return []

  return replaceKeys(data).map((item: ElegantConstRoute): ElegantConstRoute => {
    if (!item.children || !item.children.length) {
      if (!item.meta) return item
      item.meta.singleLayout = 'base'
    }

    return item
  })
}
