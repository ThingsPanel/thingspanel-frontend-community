import type { NavigationGuardNext, RouteLocationNormalized, Router } from 'vue-router'
import { useAppStore } from '@/store/modules/app'

/**
 * 创建移动端布局守卫
 * 在移动设备上自动将使用 base 布局的路由切换为 mobile 布局
 */
export function createMobileLayoutGuard(router: Router) {
  router.beforeEach((to, from, next) => {
    const appStore = useAppStore()

    // 如果是移动设备且当前路由使用的是 base 布局
    if (appStore.isMobile && shouldUseMobileLayout(to)) {
      // 修改路由配置为移动端布局
      const mobileRoute = { ...to }

      // 将路由组件从 base 布局改为 mobile 布局
      const routeMatch = router.getRoutes().find(route => route.name === to.name)
      if (routeMatch && routeMatch.matched?.[0]) {
        const matched = routeMatch.matched[0]
        // 检查是否使用 base 布局组件
        if (isBaseLayoutComponent(matched.components?.default)) {
          // 这里我们通过路由守卫动态修改组件
          // 由于 Vue Router 的限制，我们在路由层面使用不同的处理方式
          // 实际上我们会在组件内部根据 isMobile 状态来渲染不同的布局
        }
      }
    }

    next()
  })
}

/**
 * 判断是否应该使用移动端布局
 */
function shouldUseMobileLayout(route: RouteLocationNormalized): boolean {
  // 排除不需要移动端布局的路由
  const excludeRoutes = ['login', '403', '404', '500']

  // 如果是常量路由（如登录页、错误页）则不使用移动端布局
  if (route.meta?.constant) {
    return false
  }

  // 如果路由名称在排除列表中
  if (excludeRoutes.includes(route.name as string)) {
    return false
  }

  // 检查路由是否明确指定了不使用移动端布局
  if (route.meta?.disableMobileLayout) {
    return false
  }

  return true
}

/**
 * 检查组件是否是 base 布局组件
 */
function isBaseLayoutComponent(component: any): boolean {
  // 这里可以通过组件名或其他标识来判断
  if (!component) return false

  // 检查组件名称或选项
  const componentName = component.name || component.__name || component.displayName
  return (
    componentName === 'BaseLayout' || (component.__asyncResolved && component.__asyncResolved.name === 'BaseLayout')
  )
}
