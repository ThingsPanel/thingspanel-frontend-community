import { describe, expect, it } from 'vitest'
import {
  isSysAdminUser,
  resolveThingsVisSpaceId,
  SYS_ADMIN_SPACE_ID
} from '@/utils/thingsvis/space'

describe('thingsvis space helpers', () => {
  it('maps sys admin to the dedicated ThingsVis space', () => {
    const userInfo = {
      authority: 'SYS_ADMIN',
      roles: ['SYS_ADMIN']
    }

    expect(isSysAdminUser(userInfo)).toBe(true)
    expect(resolveThingsVisSpaceId(userInfo)).toBe(SYS_ADMIN_SPACE_ID)
  })

  it('keeps tenant users inside their tenant space', () => {
    const userInfo = {
      authority: 'TENANT_ADMIN',
      roles: ['TENANT_ADMIN'],
      tenantId: 'tenant-a'
    }

    expect(isSysAdminUser(userInfo)).toBe(false)
    expect(resolveThingsVisSpaceId(userInfo)).toBe('tenant-a')
  })

  it('supports legacy tenant_id payloads', () => {
    const userInfo = {
      authority: 'TENANT_USER',
      roles: ['TENANT_USER'],
      tenant_id: 'tenant-b'
    }

    expect(resolveThingsVisSpaceId(userInfo)).toBe('tenant-b')
  })
})
