import { describe, expect, it } from 'vitest'
import {
  getGlobalPlatformFields,
  resolveGlobalPlatformFieldScope
} from '@/utils/thingsvis/global-platform-fields'

describe('global-platform-fields', () => {
  it('returns tenant-only field scope for non-sys-admin users', () => {
    expect(resolveGlobalPlatformFieldScope({ authority: 'TENANT_ADMIN', roles: ['TENANT_ADMIN'] })).toBe('tenant')
  })

  it('returns super-admin field scope for sys-admin users', () => {
    expect(resolveGlobalPlatformFieldScope({ authority: 'SYS_ADMIN', roles: ['SYS_ADMIN'] })).toBe('super-admin')
  })

  it('limits tenant scope to shared aggregate fields', () => {
    const fieldIds = getGlobalPlatformFields('tenant').map(field => field.id)

    expect(fieldIds).toContain('device_total')
    expect(fieldIds).toContain('alarm_device_total')
    expect(fieldIds).toContain('home_alarm_items')
    expect(fieldIds).toContain('home_latest_report_rows')
    expect(fieldIds).not.toContain('tenant_total')
    expect(fieldIds).not.toContain('cpu_usage')
  })

  it('includes super-admin aggregate and history fields', () => {
    const fieldIds = getGlobalPlatformFields('super-admin').map(field => field.id)

    expect(fieldIds).toContain('tenant_total')
    expect(fieldIds).toContain('tenant_growth__history')
    expect(fieldIds).toContain('cpu_usage')
    expect(fieldIds).toContain('disk_usage__history')
  })
})
