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
  new Function('require', 'module', 'exports', outputText)((id: string) => {
    if (!(id in dependencies)) throw new Error(`Unexpected dependency ${id}`)
    return dependencies[id]
  }, module, module.exports)
  return module.exports
}

async function navigate(token: string | null) {
  const { createRoutes } = loadModule(new URL('../routes/index.ts', import.meta.url), {
    '../elegant/routes': { generatedRoutes: [] },
    '../elegant/imports': { layouts: {}, views: {} },
    '../elegant/transform': { transformElegantRoutesToVueRoutes: (routes: any[]) => routes }
  })
  const detail = createRoutes().constantVueRoutes.find((route: any) => route.name === 'thingmodel-detail-custom')
  assert.ok(detail, 'detail must be registered before auth initialization')
  let initializations = 0
  const menuItems: string[] = []
  const routeStore = {
    isInitAuthRoute: false,
    initAuthRoute: async () => {
      initializations += 1
      menuItems.push('首页', '设备', '物模型', '自动化')
      routeStore.isInitAuthRoute = true
      return true
    }
  }
  const { createPermissionGuard } = loadModule(new URL('./permission.ts', import.meta.url), {
    '@/store/modules/auth': { useAuthStore: () => ({ userInfo: { roles: ['TENANT_ADMIN'] }, resetStore: async () => {} }) },
    '@/store/modules/route': { useRouteStore: () => routeStore },
    '@/utils/storage': { localStg: { get: () => token } }
  })
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: detail.path, name: detail.name, meta: detail.meta, component: {} },
    { path: '/login', name: 'login', meta: { constant: true }, component: {} }
  ] })
  createPermissionGuard(router)
  await router.push({ path: detail.path, query: { id: 'model-1' } })
  await router.isReady()
  return { router, initializations, menuItems, detail }
}

test('refreshing model detail initializes authenticated menus before entering', async () => {
  const { router, initializations, menuItems, detail } = await navigate('session')
  assert.notEqual(detail.meta.constant, true)
  assert.equal(initializations, 1)
  assert.deepEqual(menuItems, ['首页', '设备', '物模型', '自动化'])
  assert.equal(router.currentRoute.value.path, '/device/thingsmodel/detail')
  assert.equal(router.currentRoute.value.query.id, 'model-1')
  await router.push('/device/thingsmodel/detail?id=model-2')
  assert.equal(initializations, 1)
})

test('unauthenticated model detail redirects to login with the original URL', async () => {
  const { router, initializations, menuItems } = await navigate(null)
  assert.equal(router.currentRoute.value.name, 'login')
  assert.equal(router.currentRoute.value.query.redirect, '/device/thingsmodel/detail?id=model-1')
  assert.equal(initializations, 0)
  assert.deepEqual(menuItems, [])
})
