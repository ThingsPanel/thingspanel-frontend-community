import { describe, it, expect, vi } from 'vitest'
import { createNativeChartCommandWriter } from '@/utils/thingsvis/native-command-write'

function fixture() {
  const binding = { deviceId: 'device', modelBinding: { modelId: 'model', snapshotId: 'fixed', publishedRevision: 3 } }
  const snapshot = {
    modelID: 'model',
    snapshotID: 'fixed',
    publishedRevision: 3,
    model: {
      fields: [
        { kind: 'COMMAND', identifier: 'set_switch' },
        { kind: 'ATTRIBUTE', identifier: 'switch' }
      ]
    }
  }
  const submit = vi.fn().mockResolvedValue({ id: 'execution', state: 'accepted' })
  const deps = {
    devices: { readTemplateBinding: vi.fn().mockResolvedValue({ binding }) },
    models: { version: vi.fn().mockResolvedValue(snapshot) },
    commands: { submit },
    newKey: vi.fn().mockReturnValueOnce('key-11111').mockReturnValueOnce('key-22222')
  }
  return { binding, snapshot, submit, deps, write: createNativeChartCommandWriter(deps as any) }
}

describe('native chart controls', () => {
  it('uses the device fixed snapshot and returns acceptance without echoing an observed value', async () => {
    const f = fixture()
    const result = await f.write('device', 'set_switch', '{"enabled":true}')
    expect(f.deps.models.version).toHaveBeenCalledWith('model', 3)
    expect(f.submit).toHaveBeenCalledWith(
      'device',
      { identifier: 'set_switch', snapshotId: 'fixed', parameters: { enabled: true } },
      'key-11111'
    )
    expect(result).toEqual({
      success: true,
      accepted: true,
      status: 'accepted',
      executionId: 'execution',
      state: 'accepted'
    })
    expect(result).not.toHaveProperty('echo')
  })
  it.each(['failed', 'timed_out', 'expired', 'cancelled', 'unknown'])(
    'preserves %s terminal replay instead of reporting success',
    async state => {
      const f = fixture()
      f.submit.mockResolvedValue({ id: 'execution', state, reason: 'runtime result' })
      expect(await f.write('device', 'set_switch', '{"enabled":true}')).toEqual({
        success: false,
        accepted: true,
        status: state,
        state,
        executionId: 'execution',
        error: 'runtime result'
      })
    }
  )
  it.each(['wrong-device', 'wrong-snapshot', 'attribute', 'missing-binding', 'owner-unavailable'])(
    'rejects %s without submitting',
    async mode => {
      const f = fixture()
      if (mode === 'wrong-device') f.binding.deviceId = 'other'
      if (mode === 'wrong-snapshot') f.snapshot.snapshotID = 'new-head'
      if (mode === 'missing-binding') f.binding.modelBinding = null as any
      if (mode === 'owner-unavailable') f.deps.devices.readTemplateBinding.mockRejectedValue(new Error('503'))
      await expect(
        f.write('device', mode === 'attribute' ? 'switch' : 'set_switch', '{"enabled":false}')
      ).rejects.toThrow()
      expect(f.submit).not.toHaveBeenCalled()
    }
  )
  it('retains the key after an unknown result; a confirmed next click starts a new operation', async () => {
    const f = fixture()
    f.submit.mockRejectedValueOnce(new TypeError('connection lost'))
    await expect(f.write('device', 'set_switch', '{"enabled":true}')).rejects.toThrow()
    await f.write('device', 'set_switch', '{"enabled":true}')
    await f.write('device', 'set_switch', '{"enabled":true}')
    expect(f.submit.mock.calls.map(call => call[2])).toEqual(['key-11111', 'key-11111', 'key-22222'])
  })
})
