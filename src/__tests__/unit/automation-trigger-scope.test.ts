import { describe, expect, it } from 'vitest'
import { definitionToForm, emptyForm, formToDefinition, mergeDefinition } from '@/utils/automation/form'

describe('trigger scope is separate from action targets', () => {
  it('locks a template-created rule to trigger subjects without tying its actions to them', () => {
    const form = emptyForm({ deviceConfigID: 'template-a' })
    form.deviceConfigIDs = ['template-b']
    const wire = formToDefinition(form)
    expect(wire.trigger_scope).toEqual({ device_config_ids: ['template-a'] })
    expect(wire.targets.device_config_ids).toEqual(['template-b'])
    expect(formToDefinition(definitionToForm(wire)).trigger_scope).toEqual(wire.trigger_scope)
  })

  it('sets device context explicitly and does not infer scope when editing an old cross-device rule', () => {
    expect(formToDefinition(emptyForm({ deviceID: 'device-a' })).trigger_scope).toEqual({ device_ids: ['device-a'] })
    const old = formToDefinition(emptyForm())
    old.targets.device_ids = ['device-b']
    const edited = definitionToForm(old)
    expect(mergeDefinition(old, formToDefinition(edited)).trigger_scope).toBeUndefined()
  })

  it('does not invent a trigger scope for a manual scene or retain an explicitly cleared scope', () => {
    expect(formToDefinition(emptyForm({ kind: 'scene', deviceID: 'device-a' })).trigger_scope).toBeUndefined()
    const original = formToDefinition(emptyForm({ deviceConfigID: 'template-a' }))
    const edited = definitionToForm(original)
    edited.triggerDeviceConfigIDs = []
    expect(mergeDefinition(original, formToDefinition(edited)).trigger_scope).toBeUndefined()
  })
})
