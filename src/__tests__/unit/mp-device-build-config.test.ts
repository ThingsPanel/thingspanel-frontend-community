// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import config from '../../../build/mp-device.config'
import type { ConfigEnv } from 'vite'

const resolveConfig = (command: ConfigEnv['command']) => {
  if (typeof config !== 'function') throw new Error('Expected environment-aware configuration')
  return config({ command, mode: 'production' })
}

afterEach(() => vi.unstubAllEnvs())

describe('mobile device build configuration', () => {
  it('production ignores malformed preview target and keeps its mobile entry', async () => {
    vi.stubEnv('MP_DEVICE_PREVIEW_TARGET', 'not a URL')
    const result = await resolveConfig('build')
    expect(result.server?.proxy).toBeUndefined()
    expect(String(result.build?.rollupOptions?.input).replaceAll('\\', '/')).toMatch(/\/mp-device\/index\.html$/)
  })
  it('preview rejects a malformed explicit target', () => {
    vi.stubEnv('MP_DEVICE_PREVIEW_TARGET', 'not a URL')
    expect(() => resolveConfig('serve')).toThrow()
  })
  it('preview has no implicit demo origin and honors an explicit origin', async () => {
    vi.stubEnv('MP_DEVICE_PREVIEW_TARGET', '')
    expect((await resolveConfig('serve')).server?.proxy).toBeUndefined()
    vi.stubEnv('MP_DEVICE_PREVIEW_TARGET', 'https://preview.example.test')
    expect((await resolveConfig('serve')).server?.proxy?.['/api/v2']).toMatchObject({ target: 'https://preview.example.test' })
  })
})

