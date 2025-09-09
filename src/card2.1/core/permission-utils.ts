/**
 * Card 2.1 权限验证工具
 * 用于组件权限控制和用户权限验证
 */

import type { ComponentPermission } from './types'

// 权限等级定义（从高到低）
const PERMISSION_LEVELS = {
  SYS_ADMIN: 4,
  TENANT_ADMIN: 3,
  TENANT_USER: 2,
  不限: 1
} as const

/**
 * 获取用户权限等级
 * @param userAuthority 用户权限
 * @returns 权限等级数字
 */
export function getUserPermissionLevel(userAuthority: string): number {
  return PERMISSION_LEVELS[userAuthority as keyof typeof PERMISSION_LEVELS] || 0
}

/**
 * 检查用户是否有权限访问组件
 * @param componentPermission 组件权限要求
 * @param userAuthority 用户权限
 * @returns 是否有权限
 */
export function hasComponentPermission(componentPermission: ComponentPermission, userAuthority: string): boolean {
  // 如果组件权限是"不限"，则所有用户都可以访问
  if (componentPermission === '不限') {
    return true
  }

  // 如果用户权限是"不限"，则不能访问任何有权限限制的组件
  if (userAuthority === '不限') {
    return false
  }

  // 获取权限等级
  const componentLevel = PERMISSION_LEVELS[componentPermission]
  const userLevel = getUserPermissionLevel(userAuthority)

  // 用户权限等级必须大于等于组件要求的权限等级
  return userLevel >= componentLevel
}

/**
 * 从本地存储获取用户信息
 * @returns 用户权限信息
 */
export function getUserAuthorityFromStorage(): string {
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      return parsed.authority || 'TENANT_USER' // 默认返回租户用户权限
    }
  } catch (error) {}

  return 'TENANT_USER' // 默认返回租户用户权限
}

/**
 * 过滤组件列表，只返回用户有权限访问的组件
 * @param components 组件列表
 * @param userAuthority 用户权限（可选，如果不提供则从本地存储获取）
 * @returns 过滤后的组件列表
 */
export function filterComponentsByPermission<T extends { permission?: ComponentPermission }>(
  components: T[],
  userAuthority?: string
): T[] {
  const authority = userAuthority || getUserAuthorityFromStorage()

  return components.filter(component => {
    const permission = component.permission || '不限'
    return hasComponentPermission(permission, authority)
  })
}

/**
 * 获取权限显示名称
 * @param permission 权限值
 * @returns 显示名称
 */
export function getPermissionDisplayName(permission: ComponentPermission): string {
  const displayNames = {
    不限: '不限',
    SYS_ADMIN: '系统管理员',
    TENANT_ADMIN: '租户管理员',
    TENANT_USER: '租户用户'
  }

  return displayNames[permission] || permission
}

/**
 * 获取所有可用权限选项
 * @returns 权限选项列表
 */
export function getAvailablePermissions(): Array<{ value: ComponentPermission; label: string }> {
  return [
    { value: '不限', label: '不限' },
    { value: 'SYS_ADMIN', label: '系统管理员' },
    { value: 'TENANT_ADMIN', label: '租户管理员' },
    { value: 'TENANT_USER', label: '租户用户' }
  ]
}
