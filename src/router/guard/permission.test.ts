import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { createMemoryHistory, createRouter } from 'vue-router'

// Run the production route definitions and guard with isolated store dependencies.
function loadModule(path: URL, dependencies: Record<string, unknown>) {
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  })
  const module = { exports: {} as any }
  new Function('require', 'module', 'exports', outputText)(
    (id: string) => {
      if (!(id in dependencies)) throw new Error(`Unexpected dependency ${id}`)
      return dependencies[id]
    },
    module,
    module.exports
  )
  return module.exports
}

async function navigate(token: string | null, target: { path: string; name?: string; query?: Record<string, string> }) {
  const routeLayout = { name: 'base-layout' }
  const routeComponent = (name: string) => ({ name })
  const layouts = new Proxy(
    { base: routeLayout, blank: routeComponent('blank-layout') },
    {
      get: (target, key: string) => target[key] ?? routeComponent(`layout-${key}`)
    }
  )
  const views = new Proxy(
    {
      'automation_rule-edit': routeComponent('view-automation_rule-edit'),
      'automation_rule-manage': routeComponent('view-automation_rule-manage'),
      device_details: routeComponent('view-device_details'),
      'device_config-detail': routeComponent('view-device_config-detail'),
      'visualization_thingsvis-preview': routeComponent('view-visualization_thingsvis-preview'),
      'device-details-app': routeComponent('view-device-details-app'),
      'visualization-app': routeComponent('view-visualization-app'),
      'visualization-app-dashboards': routeComponent('view-visualization-app-dashboards'),
      'visualization-app-preview': routeComponent('view-visualization-app-preview'),
      'thingmodel-detail': routeComponent('view-thingmodel-detail'),
      '403': routeComponent('view-403'),
      '404': routeComponent('view-404'),
      '500': routeComponent('view-500')
    },
    { get: (target, key: string) => target[key] ?? routeComponent(`view-${String(key)}`) }
  )
  const generatedRoutes = [
    {
      name: 'automation',
      path: '/automation',
      component: 'layout.base',
      meta: { title: 'automation', i18nKey: 'route.automation' },
      children: [
        {
          name: 'automation_rule-edit',
          path: '/automation/rule-edit',
          component: 'view.automation_rule-edit',
          meta: { title: 'automation_rule-edit', i18nKey: 'route.automation_rule-edit', roles: ['TENANT_ADMIN'] }
        },
        {
          name: 'automation_rule-manage',
          path: '/automation/rule-manage',
          component: 'view.automation_rule-manage',
          meta: { title: 'automation_rule-manage', i18nKey: 'route.automation_rule-manage', roles: ['TENANT_ADMIN'] }
        }
      ]
    },
    {
      name: 'device',
      path: '/device',
      component: 'layout.base',
      meta: { title: 'device', i18nKey: 'route.device' },
      children: [
        {
          name: 'device_details',
          path: '/device/details',
          component: 'view.device_details',
          meta: { title: 'device_details', i18nKey: 'route.device_details' }
        }
      ]
    }
  ]
  const transformModule = loadModule(new URL('../elegant/transform.ts', import.meta.url), {})
  const routeModule = loadModule(new URL('../routes/index.ts', import.meta.url), {
    '../elegant/routes': { generatedRoutes },
    '../elegant/imports': { layouts, views },
    '../elegant/transform': transformModule
  })
  const { createRoutes, getAuthVueRoutes } = routeModule
  const created = createRoutes()
  const preRegisteredTargets = [
    { path: '/automation/rule-edit', name: 'automation_rule-edit', query: undefined },
    { path: '/automation/rule-manage', name: 'automation_rule-manage', query: undefined },
    { path: '/device/template/detail', name: 'device-template-detail-reference', query: { id: 'template-1' } },
    { path: '/device/details', name: 'device_details', query: { d_id: 'device-1' } },
    { path: '/device/thingsmodel/detail', name: 'thingmodel-detail-custom', query: { id: 'model-1' } }
  ]
  for (const target of preRegisteredTargets) {
    const route = routerRouteForTarget(created.constantVueRoutes, target.path, target.name)
    assert.ok(route, `${target.path} must be registered before auth initialization`)
    assert.notEqual(route.meta?.constant, true, `${target.path} must remain login-protected`)
  }
  let initializations = 0
  const menuItems: string[] = []
  const routeStore = {
    isInitAuthRoute: false,
    initAuthRoute: async () => {
      initializations += 1
      menuItems.push('首页', '设备', '物模型', '自动化')
      getAuthVueRoutes(created.authRoutes).forEach((route: any) => router.addRoute(route))
      routeStore.isInitAuthRoute = true
      return true
    }
  }
  const { createPermissionGuard } = loadModule(new URL('./permission.ts', import.meta.url), {
    '@/store/modules/auth': {
      useAuthStore: () => ({ userInfo: { roles: ['TENANT_ADMIN'] }, resetStore: async () => {} })
    },
    '@/store/modules/route': { useRouteStore: () => routeStore },
    '@/utils/storage': { localStg: { get: () => token } }
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [...created.constantVueRoutes, { path: '/login', name: 'login', meta: { constant: true }, component: {} }]
  })
  for (const target of preRegisteredTargets) {
    assert.ok(router.resolve(target.path).matched.length, `${target.path} must match before auth initialization`)
  }
  createPermissionGuard(router)
  await router.push({ path: target.path, query: target.query })
  await router.isReady()
  return { router, initializations, menuItems, created, preRegisteredTargets }
}

function routerRouteForTarget(routes: any[], path: string, name: string): any {
  for (const route of routes) {
    if (route.name === name) return route
    const child = routerRouteForTarget(route.children ?? [], path, name)
    if (child) return child
  }
  return undefined
}

test('native detail and nested rule routes survive authenticated cold start', async () => {
  for (const target of [
    { path: '/automation/rule-edit', name: 'automation_rule-edit', query: undefined },
    { path: '/automation/rule-manage', name: 'automation_rule-manage', query: undefined },
    { path: '/device/template/detail', name: 'device-template-detail-reference', query: { id: 'template-1' } },
    { path: '/device/details', name: 'device_details', query: { d_id: 'device-1' } }
  ]) {
    const { router, initializations, created } = await navigate('session', target)
    assert.equal(initializations, 1, `${target.path} initializes authenticated routes`)
    assert.equal(router.currentRoute.value.path, target.path)
    assert.equal(router.currentRoute.value.name, target.name, `${target.path} resolves to its canonical route`)
    assert.ok(router.currentRoute.value.matched.length >= 2, `${target.path} includes a layout and page route`)
    assert.ok(
      router.currentRoute.value.matched.every(route => Boolean(route.components?.default)),
      `${target.path} has renderable components at each matched level`
    )
    if (target.query) {
      for (const [key, value] of Object.entries(target.query)) {
        assert.equal(router.currentRoute.value.query[key], value)
      }
    }
    const expectedRoles = target.name.startsWith('automation_') ? ['TENANT_ADMIN'] : []
    assert.deepEqual(router.currentRoute.value.meta.roles ?? [], expectedRoles)
    assert.equal(router.currentRoute.value.meta.constant, undefined)
    const nameMatches = router.getRoutes().filter((route: any) => route.name === target.name)
    assert.equal(nameMatches.length, 1, `${target.name} is not duplicated after auth routes are added`)
    assert.ok(created.authRoutes.some((route: any) => route.name === 'automation'))
  }
})

test('unauthenticated native and rule details redirect to login with original query', async () => {
  for (const target of [
    { path: '/automation/rule-edit', query: undefined },
    { path: '/automation/rule-manage', query: undefined },
    { path: '/device/template/detail', query: { id: 'template-1' } },
    { path: '/device/details', query: { d_id: 'device-1' } },
    { path: '/device/thingsmodel/detail', query: { id: 'model-1' } }
  ]) {
    const { router, initializations, menuItems } = await navigate(null, target)
    const queryString = target.query ? `?${new URLSearchParams(target.query).toString()}` : ''
    assert.equal(router.currentRoute.value.name, 'login')
    assert.equal(router.currentRoute.value.query.redirect, `${target.path}${queryString}`)
    assert.equal(initializations, 0)
    assert.deepEqual(menuItems, [])
  }
})
