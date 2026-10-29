/** Rule management is restricted to tenant admins; SYS_ADMIN is excluded. */
export function canManageAutomationRules(roles?: string[]): boolean {
  return Boolean(roles?.includes('TENANT_ADMIN') && !roles.includes('SYS_ADMIN'))
}

export function automationRulePermissionMessage() {
  return '只有租户管理员可以查看和管理自动化规则。'
}
