import { describe, expect, it } from 'vitest'
import { DEVICE_ROUTE_NAME_BY_PATH, DEVICE_ROUTE_PATHS } from '@/router/device-route-mapping'

describe('device route historical mapping', () => {
  it('keeps Device Template and Thing Model bound to the correct pages', () => {
    expect(DEVICE_ROUTE_PATHS.device_config).toBe('/device/template')
    expect(DEVICE_ROUTE_PATHS.device_template).toBe('/device/thingsmodel')
    expect(DEVICE_ROUTE_PATHS.device_integration).toBe('/device/integration')
    expect(DEVICE_ROUTE_NAME_BY_PATH['/device/config']).toBe('device_config')
    expect(DEVICE_ROUTE_NAME_BY_PATH['/device/template']).toBe('device_config')
    expect(DEVICE_ROUTE_NAME_BY_PATH['/device/thingsmodel']).toBe('device_template')
    expect(DEVICE_ROUTE_NAME_BY_PATH['/device/service-access']).toBe('device_integration')
    expect(DEVICE_ROUTE_NAME_BY_PATH['/device/integration']).toBe('device_integration')
  })
})
