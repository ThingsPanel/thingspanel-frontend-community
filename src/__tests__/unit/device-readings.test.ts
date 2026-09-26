import { describe, expect, it } from 'vitest'
import {
  getBooleanReadingState,
  getCompactReadingDisplayValue,
  getReadingDisplayValue,
  isBooleanReading,
  isDisplayableReading,
  isNumericReading
} from '@/utils/device-readings'

describe('device compact readings', () => {
  it('detects boolean model values and renders their current switch state', () => {
    const enabled = { value: 1, data_type: 'boolean' }
    const disabled = { value: 'false', data_type: 'bool' }

    expect(isBooleanReading(enabled)).toBe(true)
    expect(getBooleanReadingState(enabled)).toBe(true)
    expect(getCompactReadingDisplayValue(enabled)).toBe('1')
    expect(isNumericReading(enabled)).toBe(true)
    expect(getBooleanReadingState(disabled)).toBe(false)
    expect(getCompactReadingDisplayValue(disabled)).toBe('0')
  })

  it('does not infer a switch from an ordinary numeric reading', () => {
    const reading = { value: 1, data_type: 'number' }

    expect(isBooleanReading(reading)).toBe(false)
    expect(isNumericReading(reading)).toBe(true)
  })

  it('recognizes binary Home Assistant states as a read-only switch presentation', () => {
    expect(isBooleanReading({ value: 'open' })).toBe(true)
    expect(getBooleanReadingState({ value: 'close' })).toBe(false)
    expect(getCompactReadingDisplayValue({ value: 'off' })).toBe('0')
    expect(isNumericReading({ value: 'off' })).toBe(false)
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
})
