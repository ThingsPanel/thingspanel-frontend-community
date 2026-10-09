import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

describe('notification page compilation', () => {
  for (const page of [
    'alarm/notification-record/NotificationDeliveries.vue',
    'alarm/notification-group/index.vue',
    'alarm/notification-group/NotificationAvailablePlugins.vue',
    'alarm/notification-group/NotificationGroups.vue',
    'management/notification/NotificationInstances.vue',
    'apply/plugin/NotificationPlugins.vue'
  ]) {
    it(`compiles the actual ${page} script and template`, () => {
      const filename = resolve(process.cwd(), 'src/views', page)
      const { descriptor, errors } = parse(readFileSync(filename, 'utf8'), { filename })
      expect(errors).toEqual([])
      const script = compileScript(descriptor, { id: page })
      const template = compileTemplate({
        id: page,
        filename,
        source: descriptor.template?.content || '',
        compilerOptions: { bindingMetadata: script.bindings }
      })
      expect(template.errors).toEqual([])
    })
  }
})
