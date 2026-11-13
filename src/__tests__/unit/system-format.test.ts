import { describe, expect, it } from 'vitest'
import zh from '@/locales/langs/zh-cn/system-manage.json'
import en from '@/locales/langs/en-us/system-manage.json'

describe('maintenance step labels', () => {
  it('zh and en cover the same steps, including every agent step', () => {
    expect(Object.keys(en.maintenance.steps).sort()).toEqual(Object.keys(zh.maintenance.steps).sort())
    for (const s of [
      'starting_new_version',
      'snapshot',
      'stopping',
      'restoring_databases',
      'dumping',
      'maintenance_on'
    ]) {
      expect(zh.maintenance.steps).toHaveProperty(s)
    }
  })
})
