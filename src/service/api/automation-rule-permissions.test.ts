import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canManageAutomationRules } from './automation-rule-permissions'

test('automation rule management requires tenant admin and excludes system admin', () => {
  assert.equal(canManageAutomationRules(['TENANT_ADMIN']), true)
  assert.equal(canManageAutomationRules(['SYS_ADMIN']), false)
  assert.equal(canManageAutomationRules(['TENANT_ADMIN', 'SYS_ADMIN']), false)
  assert.equal(canManageAutomationRules(['TENANT_USER']), false)
  assert.equal(canManageAutomationRules(undefined), false)
})
