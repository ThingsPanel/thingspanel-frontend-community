/**
 * Keep the historical route keys stable while making their visible paths explicit.
 *
 * The names are retained for backend/menu compatibility:
 * - device_config    -> Device Template page
 * - device_template  -> Thing Model page
 */
export const DEVICE_ROUTE_PATHS = {
  device_config: '/device/template',
  device_template: '/device/thingsmodel',
  device_integration: '/device/integration'
} as const

export const DEVICE_ROUTE_NAME_BY_PATH = {
  '/device/config': 'device_config',
  [DEVICE_ROUTE_PATHS.device_config]: 'device_config',
  [DEVICE_ROUTE_PATHS.device_template]: 'device_template',
  '/device/service-access': 'device_integration',
  [DEVICE_ROUTE_PATHS.device_integration]: 'device_integration'
} as const

export type DeviceRouteKey = keyof typeof DEVICE_ROUTE_PATHS
