import { describe, expect, it } from 'vitest'
import {
  buildSwitchCommandValue,
  getCanonicalOnOffReadingState,
  matchesSwitchTelemetryTarget,
  resolveStandardBooleanCommand
} from '@/utils/device-readings'
import { nativeCommandOptions } from '@/views/device/native-device-model-contract'

describe('compact native switch mapping', () => {
  it('normalizes telemetry without changing the enum command wire value', () => {
    const reading = { key: 'power', value: ' ON ', data_type: 'Enum' }
    const binding = resolveStandardBooleanCommand(reading, [
      {
        identifier: 'power',
        params: [{ identifier: 'action', param_type: 'enum', enum_config: [{ value: 'On' }, { value: 'OFF' }] }]
      }
    ])!
    expect(getCanonicalOnOffReadingState(reading)).toBe(true)
    expect(JSON.parse(buildSwitchCommandValue(binding, false))).toEqual({ action: 'OFF' })
    expect(matchesSwitchTelemetryTarget({ ...reading, value: 'off' }, false)).toBe(true)
    expect(matchesSwitchTelemetryTarget({ ...reading, value: 'turn_off' }, false)).toBe(false)
  })
  it('maps pinned native Boolean command parameters and rejects ambiguous schemas', () => {
    const model: any = {
      fields: [
        {
          identifier: 'power',
          nameI18n: { default: 'Power' },
          kind: 'COMMAND',
          parameters: { items: [{ identifier: 'enabled', valueType: { kind: 'BOOL' } }] }
        }
      ]
    }
    const commands = nativeCommandOptions(model)
    const binding = resolveStandardBooleanCommand({ key: 'power', value: true, data_type: 'Boolean' }, commands)
    expect(binding).not.toBeNull()
    expect(JSON.parse(buildSwitchCommandValue(binding!, false))).toEqual({ enabled: false })
    expect(
      resolveStandardBooleanCommand({ key: 'power', value: true, data_type: 'Boolean' }, [
        { identifier: 'power', params: [] }
      ])
    ).toBeNull()
  })
})
