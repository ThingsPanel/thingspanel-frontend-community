/**
 * 权限工具函数
 * 简化的权限检查系统
 */

import type { ComponentDefinition, UserAuthority } from '../types'

/**
 * 从存储中获取用户权限
 */
export function getUserAuthorityFromStorage(): UserAuthority {
  try {
    // 这里应该从实际的存储中获取用户权限
    // 暂时返回默认值
    return 'TENANT_ADMIN'
  } catch (error) {
    console.warn('❌ [permission] 获取用户权限失败，使用默认权限')
    return 'TENANT_ADMIN'
  }
}

/**
 * 检查组件权限
 */
export function checkComponentPermission(definition: ComponentDefinition, userAuthority?: UserAuthority): boolean {
  const permission = definition.permission || '不限'
  const authority = userAuthority || getUserAuthorityFromStorage()

  // 如果组件权限是"不限"，则所有用户都可以访问
  if (permission === '不限') {
    return true
  }

  // 如果用户权限是"不限"，则不能访问任何有权限限制的组件
  if (authority === '不限') {
    return false
  }

  // 权限等级检查
  const permissionLevels = {
    SYS_ADMIN: 4,
    TENANT_ADMIN: 3,
    TENANT_USER: 2,
    不限: 1
  }

  const componentLevel = permissionLevels[permission as keyof typeof permissionLevels]
  const userLevel = permissionLevels[authority as keyof typeof permissionLevels] || 0
  const hasPermission = userLevel >= componentLevel

  return hasPermission
}

/**
 * 过滤组件列表（按权限）
 */
export function filterComponentsByPermission(components: ComponentDefinition[]): ComponentDefinition[] {
  const userAuthority = getUserAuthorityFromStorage()
  return components.filter(component => checkComponentPermission(component, userAuthority))
}