import { describe, expect, it } from 'vitest'
import {
  definitionToForm,
  emptyForm,
  emptyStep,
  formToDefinition,
  mergeDefinition,
  validateForm
} from '@/utils/automation/form'

describe('published automation command identifiers', () => {
  it.each(['Mode-Wire', '  Vendor.Mode/°C  ', ' '])('preserves %j across edit and wire serialization', identifier => {
    const form = emptyForm()
    form.name = 'Exact published command'
    const step = emptyStep('action')
    step.action = 'command'
    step.identifier = identifier
    step.value = '{"  target/value  ":false}'
    form.steps = [step]
    expect(validateForm(form).filter(issue => issue.field.includes('identifier'))).toEqual([])
    const definition = formToDefinition(form)
    expect(definition.steps[0].identifier).toBe(identifier)
    const edited = formToDefinition(definitionToForm(definition, form.name))
    expect(mergeDefinition(definition, edited).steps[0]).toEqual(definition.steps[0])
  })

  it('still rejects an absent command identifier', () => {
    const form = emptyForm()
    const step = emptyStep('action')
    step.action = 'command'
    step.identifier = ''
    form.steps = [step]
    expect(validateForm(form).some(issue => issue.field.endsWith('.identifier') && issue.code === 'required')).toBe(
      true
    )
  })
})
