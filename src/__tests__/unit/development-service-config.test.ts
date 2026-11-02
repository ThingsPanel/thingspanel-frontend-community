import { describe, expect, it } from 'vitest'
import { createServiceConfig } from '../../../env.config'

describe('development service configuration', () => {
  it('defaults to the local backend', () => {
    const config = createServiceConfig({ VITE_SERVICE_ENV: 'dev' } as Env.ImportMeta)
    expect(config.baseURL).toBe('http://127.0.0.1:9999/api/v1')
    expect(config.otherBaseURL.demo).toBe(config.baseURL)
  })

  it('accepts an explicitly configured development backend', () => {
    const config = createServiceConfig({
      VITE_SERVICE_ENV: 'dev',
      VITE_METADATA_CONNECTOR_URL: 'http://127.0.0.1:19999/api/v1'
    } as Env.ImportMeta)
    expect(config.baseURL).toBe('http://127.0.0.1:19999/api/v1')
  })
})
