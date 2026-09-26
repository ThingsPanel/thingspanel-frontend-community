import { describe, expect, it } from 'vitest'
import {
  getBooleanReadingState,
  getCompactReadingDisplayValue,
  getReadingDisplayValue,
  isBooleanReading,
  isDisplayableReading,
  isNumericReading,
  resolveStandardBooleanCommand
} from '@/utils/device-readings'

describe('device compact readings', () => {
  it('accepts only Boolean model values encoded as JSON booleans', () => {
    const enabled = { key: 'enabled', value: true, data_type: 'Boolean' }
    const disabled = { key: 'enabled', value: false, data_type: 'boolean' }

    expect(isBooleanReading(enabled)).toBe(true)
    expect(getBooleanReadingState(enabled)).toBe(true)
    expect(getCompactReadingDisplayValue(enabled)).toBe('1')
    expect(isNumericReading(enabled)).toBe(false)
    expect(getBooleanReadingState(disabled)).toBe(false)
    expect(getCompactReadingDisplayValue(disabled)).toBe('0')
    expect(isBooleanReading({ key: 'enabled', value: 1, data_type: 'boolean' })).toBe(false)
    expect(isBooleanReading({ key: 'enabled', value: 'true', data_type: 'boolean' })).toBe(false)
    expect(isBooleanReading({ key: 'enabled', value: true })).toBe(false)
  })

  it('does not infer a switch from an ordinary numeric reading', () => {
    const reading = { value: 1, data_type: 'number' }

    expect(isBooleanReading(reading)).toBe(false)
    expect(isNumericReading(reading)).toBe(true)
  })

  it('does not infer Boolean values from strings, binary numbers, or enum descriptions', () => {
    expect(isBooleanReading({ key: 'state', value: 'open' })).toBe(false)
    expect(getBooleanReadingState({ key: 'state', value: '0', data_type: 'boolean' })).toBe(null)
    expect(getCompactReadingDisplayValue({ key: 'state', value: 'off' })).toBe('off')
    expect(isBooleanReading({ key: 'state', value: true, enum: [{ value: true, value_type: 'boolean' }] })).toBe(false)
  })

  it('uses enum descriptions in the dense list while preserving unknown values', () => {
    const reading = {
      value: 0,
      enum: [
        { value: 0, value_type: 'number', description: '关闭' },
        { value: 1, value_type: 'number', description: '打开' }
      ]
    }

    expect(getReadingDisplayValue(reading)).toBe('关闭')
    expect(getReadingDisplayValue({ value: 7 })).toBe('7')
    expect(getReadingDisplayValue({ value: null })).toBe('--')
  })

  it('hides transport metadata while keeping named custom telemetry', () => {
    expect(isDisplayableReading({ key: 'device_id', value: 'id' })).toBe(false)
    expect(isDisplayableReading({ key: 'values', value: '{}' })).toBe(false)
    expect(isDisplayableReading({ key: '_data1', value: 25 })).toBe(false)
    expect(isDisplayableReading({ key: '_custom', label: 'Custom metric', value: 25 })).toBe(true)
  })

  it('requires a same-identifier command with one explicit Boolean parameter', () => {
    const reading = { key: 'power', value: false, data_type: 'boolean' }
    const command = {
      data_identifier: 'power',
      params: [{ data_identifier: 'enabled', param_type: 'Boolean' }]
    }

    expect(resolveStandardBooleanCommand(reading, [command])).toEqual({
      identify: 'power',
      parameterIdentifier: 'enabled'
    })
    expect(
      resolveStandardBooleanCommand(reading, [
        { ...command, params: [{ data_identifier: 'enabled', param_type: 'String' }] }
      ])
    ).toBe(null)
    expect(
      resolveStandardBooleanCommand(reading, [
        { ...command, params: [...command.params, { data_identifier: 'mode', param_type: 'Boolean' }] }
      ])
    ).toBe(null)
    expect(resolveStandardBooleanCommand({ ...reading, value: 'false' }, [command])).toBe(null)
  })
})
