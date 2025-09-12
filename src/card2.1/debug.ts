/**
 * Card 2.1 调试工具
 * 用于开发和测试阶段的调试功能
 */

import { initializeCard2System, getComponentTree, getAllComponents, reapplyPermissionFilter } from '@/card2.1/index'
import { getUserAuthorityFromStorage, hasComponentPermission, getAvailablePermissions } from '@/card2.1/core/permission-utils'
import type { ComponentPermission } from '@/card2.1/core/types'

/**
 * 测试权限系统（仅开发环境可用）
 */
export async function testPermissionSystem() {
  // 生产环境保护
  if (process.env.NODE_ENV !== 'development') {
    console.error('[DEBUG] testPermissionSystem - development env only')
    return
  }

  if (process.env.NODE_ENV === 'development') {
  }

  // 1. 初始化系统
  await initializeCard2System()

  // 2. 获取当前用户权限
  const userAuthority = getUserAuthorityFromStorage()
  if (process.env.NODE_ENV === 'development') {
  }

  // 3. 获取所有组件（包括无权限的）
  const allComponents = getAllComponents()
  if (process.env.NODE_ENV === 'development') {
  }

  // 4. 获取权限过滤后的组件
  const filteredComponents = getComponentTree().components
  if (process.env.NODE_ENV === 'development') {
  }

  // 5. 测试权限检查函数
  if (process.env.NODE_ENV === 'development') {
  }
  const testPermissions: ComponentPermission[] = ['不限', 'TENANT_USER', 'TENANT_ADMIN', 'SYS_ADMIN']

  testPermissions.forEach(permission => {
    const hasAccess = hasComponentPermission(permission, userAuthority)
    if (process.env.NODE_ENV === 'development') {
    }
  })

  // 6. 显示可用权限选项
  const availablePermissions = getAvailablePermissions()
  if (process.env.NODE_ENV === 'development') {
  }
}

/**
 * 模拟不同权限用户（仅开发环境可用）
 */
export function simulateUserPermission(permission: string) {
  // 生产环境保护
  if (process.env.NODE_ENV !== 'development') {
    console.error('[DEBUG] simulateUserPermission - development env only')
    return
  }

  if (process.env.NODE_ENV === 'development') {
  }

  // 模拟修改本地存储中的用户权限
  const mockUserInfo = {
    authority: permission,
    userName: 'test-user',
    roles: [permission]
  }

  localStorage.setItem('userInfo', JSON.stringify(mockUserInfo))

  // 重新应用权限过滤
  reapplyPermissionFilter()

  if (process.env.NODE_ENV === 'development') {
  }
}

/**
 * 显示组件权限统计（仅开发环境可用）
 */
export function showComponentPermissionStats() {
  // 生产环境保护
  if (process.env.NODE_ENV !== 'development') {
    console.error('[DEBUG] showComponentPermissionStats - development env only')
    return
  }

  const allComponents = getAllComponents()
  const userAuthority = getUserAuthorityFromStorage()

  const stats = {
    total: allComponents.length,
    unlimited: allComponents.filter(c => c.permission === '不限').length,
    tenantUser: allComponents.filter(c => c.permission === 'TENANT_USER').length,
    tenantAdmin: allComponents.filter(c => c.permission === 'TENANT_ADMIN').length,
    sysAdmin: allComponents.filter(c => c.permission === 'SYS_ADMIN').length,
    accessible: allComponents.filter(c => hasComponentPermission(c.permission || '不限', userAuthority)).length
  }

  if (process.env.NODE_ENV === 'development') {
  }

  return stats
}
