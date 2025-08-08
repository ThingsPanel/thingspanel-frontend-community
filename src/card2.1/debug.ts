/**
 * Card 2.1 调试工具
 * 用于开发和测试阶段的调试功能
 */

import { initializeCard2System, getComponentTree, getAllComponents, reapplyPermissionFilter } from './index'
import { getUserAuthorityFromStorage, hasComponentPermission, getAvailablePermissions } from './core/permission-utils'
import type { ComponentPermission } from './core/types'

/**
 * 测试权限系统
 */
export async function testPermissionSystem() {
  console.log('🧪 [Debug] 开始测试权限系统...')

  // 1. 初始化系统
  await initializeCard2System()

  // 2. 获取当前用户权限
  const userAuthority = getUserAuthorityFromStorage()
  console.log('👤 [Debug] 当前用户权限:', userAuthority)

  // 3. 获取所有组件（包括无权限的）
  const allComponents = getAllComponents()
  console.log(
    '📦 [Debug] 所有组件:',
    allComponents.map(c => ({
      name: c.name,
      type: c.type,
      permission: c.permission || '不限'
    }))
  )

  // 4. 获取权限过滤后的组件
  const filteredComponents = getComponentTree().components
  console.log(
    '✅ [Debug] 权限过滤后的组件:',
    filteredComponents.map(c => ({
      name: c.name,
      type: c.type,
      permission: c.permission || '不限'
    }))
  )

  // 5. 测试权限检查函数
  console.log('🔍 [Debug] 权限检查测试:')
  const testPermissions: ComponentPermission[] = ['不限', 'TENANT_USER', 'TENANT_ADMIN', 'SYS_ADMIN']

  testPermissions.forEach(permission => {
    const hasAccess = hasComponentPermission(permission, userAuthority)
    console.log(`  - 组件权限 "${permission}" -> 用户 "${userAuthority}": ${hasAccess ? '✅ 有权限' : '❌ 无权限'}`)
  })

  // 6. 显示可用权限选项
  const availablePermissions = getAvailablePermissions()
  console.log('📋 [Debug] 可用权限选项:', availablePermissions)

  console.log('🎉 [Debug] 权限系统测试完成!')
}

/**
 * 模拟不同权限用户
 */
export function simulateUserPermission(permission: string) {
  console.log(`🔄 [Debug] 模拟用户权限: ${permission}`)

  // 模拟修改本地存储中的用户权限
  const mockUserInfo = {
    authority: permission,
    userName: 'test-user',
    roles: [permission]
  }

  localStorage.setItem('userInfo', JSON.stringify(mockUserInfo))

  // 重新应用权限过滤
  reapplyPermissionFilter()

  console.log('✅ [Debug] 权限模拟完成，请重新获取组件列表')
}

/**
 * 显示组件权限统计
 */
export function showComponentPermissionStats() {
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

  console.log('📊 [Debug] 组件权限统计:', {
    ...stats,
    userAuthority,
    accessiblePercentage: `${((stats.accessible / stats.total) * 100).toFixed(1)}%`
  })

  return stats
}
