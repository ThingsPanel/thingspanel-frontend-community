import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('@/router/elegant/imports', () => ({
  layouts: { base: {}, blank: {} },
  views: { device_details: {}, 'automation_rule-edit': {} }
}))
vi.mock('@/router/elegant/routes', () => ({ generatedRoutes: [] }))
vi.mock('@/router/elegant/transform', () => ({ transformElegantRoutesToVueRoutes: () => [] }))

import { createRoutes } from '@/router/routes'

describe('protected detail links after authenticated menus replace route names', () => {
  it.each([
    ['/device/details', 'device_details', 'device-details-reference'],
    ['/automation/rule-edit', 'automation_rule-edit', 'automation-rule-edit-reference']
  ])('opens %s before and after dynamic route installation', async (path, name, fallbackName) => {
    const router = createRouter({ history: createMemoryHistory(), routes: createRoutes().constantVueRoutes })
    await router.push(`${path}?d_id=qa-device#details`)
    expect(router.currentRoute.value.name).toBe(fallbackName)
    expect(router.currentRoute.value.meta.constant).not.toBe(true)

    // Vue Router removes the old named child while its unnamed layout remains.
    // A path link must reach the replacement child, not render the empty layout.
    const removeDynamicRoute = router.addRoute({
      path: '/authenticated',
      component: {},
      children: [{ path, name, component: {}, meta: { roles: ['TENANT_ADMIN'] } }]
    })
    await router.push(`${path}?d_id=another-qa-device#details`)
    expect(router.currentRoute.value.name).toBe(fallbackName)
    expect(router.currentRoute.value.query.d_id).toBe('another-qa-device')
    expect(router.currentRoute.value.hash).toBe('#details')
    if (name === 'automation_rule-edit') expect(router.currentRoute.value.meta.roles).toEqual(['TENANT_ADMIN'])
    expect(router.currentRoute.value.meta.constant).not.toBe(true)
    await router.push({ name, query: { d_id: 'named-link' } })
    expect(router.currentRoute.value.name).toBe(name)
    removeDynamicRoute()
    await router.push(`${path}?d_id=after-logout`)
    expect(router.currentRoute.value.name).toBe(fallbackName)
    expect(router.currentRoute.value.meta.constant).not.toBe(true)
  })
})
