import { expect, it, vi } from 'vitest'
import { createRule } from '@/service/api/automation-rules'

const { createTransport } = vi.hoisted(() => ({ createTransport: vi.fn() }))
vi.mock('axios', () => ({ default: { create: createTransport } }))
vi.mock('@/utils/storage', () => ({ localStg: { get: vi.fn() } }))
vi.mock('@/service/api/automation-runtime', () => ({ getAutomationMode: vi.fn().mockResolvedValue('legacy') }))

it('rejects direct native writes before creating an HTTP transport in legacy mode', async () => {
  await expect(createRule({ name: 'Rule', definition: {} as any, enabled: true })).rejects.toMatchObject({
    code: 'native_engine_disabled'
  })
  expect(createTransport).not.toHaveBeenCalled()
})
