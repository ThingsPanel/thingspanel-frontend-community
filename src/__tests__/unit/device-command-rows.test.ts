import { describe, expect, it } from 'vitest'
import {
  commandReasonText,
  commandRowsFromReceipts,
  commandStateLabel,
  createCommandSubmitter,
  parseTableExpected,
  parseTableSubmit
} from '@/service/api/device-command-rows'
import type { CommandReceipt } from '@/service/api/device-command-native-transport'

const receipt = (over: Partial<CommandReceipt> = {}): CommandReceipt => ({
  id: 'r1',
  deviceId: 'd1',
  state: 'accepted',
  acceptedAt: '2026-10-28T00:00:00.000Z',
  deliveryAt: null,
  acknowledgedAt: null,
  reason: null,
  expiresAt: null,
  identifier: 'reboot',
  snapshotId: 's1',
  deliveryMode: 'immediate',
  label: null,
  parameters: { delay: 3 },
  redactedParameterPaths: [],
  ...over
})

describe('command rows', () => {
  it('maps receipts to table rows without inventing delivery', () => {
    const [row] = commandRowsFromReceipts([receipt()])
    expect(row).toMatchObject({
      id: 'r1',
      identify: 'reboot',
      status: 'accepted',
      data: '{"delay":3}',
      error_message: ''
    })
    expect(row.status_label).toBe('运行时已接收')
    expect(row.cancellable).toBe(false)
    expect(commandRowsFromReceipts([receipt({ deliveryMode: 'when_online' })])[0].cancellable).toBe(true)
    expect(commandRowsFromReceipts([receipt({ deliveryMode: 'when_online', state: 'delivered' })])[0].cancellable).toBe(
      false
    )
    expect(commandStateLabel('nonsense')).toBe('结果未知')
  })
  it('parses the table submit payload', () => {
    expect(parseTableSubmit({ identify: ' set ', value: '{"a":1}' })).toEqual({
      identifier: 'set',
      parameters: { a: 1 }
    })
    expect(parseTableSubmit({ identify: 'x', value: null })).toEqual({ identifier: 'x', parameters: {} })
    expect(() => parseTableSubmit({ identify: '', value: null })).toThrow()
    expect(() => parseTableSubmit({ identify: 'x', value: '[1]' })).toThrow()
    expect(() => parseTableSubmit({ identify: 'x', value: '{bad' })).toThrow()
  })
})

describe('command submitter', () => {
  const parsed = { identifier: 'reboot', parameters: { delay: 3 } }
  it('reuses the key after an unknown outcome and drops it after a success', async () => {
    const keys: string[] = []
    let n = 0
    let fail = true
    const submitter = createCommandSubmitter({
      newKey: () => `key-${++n}-aaaaaaaa`,
      send: async (_d, _b, key) => {
        keys.push(key)
        if (fail) throw new Error('network')
        return receipt()
      }
    })
    await expect(submitter.submit('d1', 's1', parsed)).rejects.toThrow()
    fail = false
    await submitter.submit('d1', 's1', parsed)
    await submitter.submit('d1', 's1', parsed)
    expect(keys).toEqual(['key-1-aaaaaaaa', 'key-1-aaaaaaaa', 'key-2-aaaaaaaa'])
  })
  it('starts a new key after an HTTP answer or a changed payload', async () => {
    const keys: string[] = []
    let n = 0
    let mode: 'unknown' | 'http' = 'unknown'
    const submitter = createCommandSubmitter({
      newKey: () => `key-${++n}-aaaaaaaa`,
      send: async (_d, _b, key) => {
        keys.push(key)
        throw mode === 'http' ? Object.assign(new Error('bad'), { status: 422 }) : new Error('network')
      }
    })
    await expect(submitter.submit('d1', 's1', parsed)).rejects.toThrow()
    await expect(submitter.submit('d1', 's1', { ...parsed, parameters: { delay: 4 } })).rejects.toThrow()
    mode = 'http'
    await expect(submitter.submit('d1', 's1', parsed)).rejects.toThrow()
    await expect(submitter.submit('d1', 's1', parsed)).rejects.toThrow()
    expect(keys).toEqual(['key-1-aaaaaaaa', 'key-2-aaaaaaaa', 'key-3-aaaaaaaa', 'key-4-aaaaaaaa'])
  })
})

describe('expected command parsing', () => {
  it('maps the table expected payload to a when_online submission', () => {
    expect(parseTableExpected({ identify: 'r', payload: '{"a":1}', expiry: '2026-10-29T08:00:00+08:00' })).toEqual({
      identifier: 'r',
      parameters: { a: 1 },
      deliveryMode: 'when_online',
      expiresAt: '2026-10-29T00:00:00Z'
    })
    expect(parseTableExpected({ identify: 'r', payload: null, expiry: null }).expiresAt).toBe(null)
    expect(() => parseTableExpected({ identify: 'r', payload: null, expiry: 'nope' })).toThrow()
  })
})

describe('command reasons', () => {
  it('translates the reasons the backend writes and keeps runtime text as received', () => {
    expect(commandReasonText('the device runtime did not accept the command')).toBe('设备运行时明确拒绝了该命令')
    expect(commandReasonText('the device runtime did not confirm whether it received the command')).toBe(
      '设备运行时未确认是否收到该命令'
    )
    expect(commandReasonText('device offline')).toBe('device offline')
    expect(commandReasonText(null)).toBe('')
    expect(
      commandRowsFromReceipts([
        receipt({ state: 'failed', reason: 'the device runtime did not accept the command' })
      ])[0].error_message
    ).toBe('设备运行时明确拒绝了该命令')
  })
})
