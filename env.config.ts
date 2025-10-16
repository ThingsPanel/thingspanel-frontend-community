/**
 * Create service config by current env
 *
 * @param env The current env
 */
export function createServiceConfig(env: Env.ImportMeta) {
  const mockURL = 'https://mock.apifox.com/m1/4080832-0-default'
  // const devURL = 'http://47.92.253.145:9999/api/v1';
  // const devURL = '  http://47.115.210.16:8080/api/v1';
  const devURL = 'http://c.thingspanel.cn/api/v1'
  // const devURL = 'http://demo.thingspanel.cn/api/v1';

  const testURL = ''
  const prodURL = ''

  const serviceConfigMap: App.Service.ServiceConfigMap = {
    dev: {
      baseURL: devURL,
      otherBaseURL: {
        demo: devURL,
        mock: mockURL
      },
      sseEndpoint: '/proxy-default/events'
    },
    test: {
      baseURL: mockURL,
      otherBaseURL: {
        demo: testURL,
        mock: mockURL
      },
      sseEndpoint: '/api/v1/events'
    },
    prod: {
      baseURL: prodURL,
      otherBaseURL: {
        demo: prodURL,
        mock: mockURL
      },
      sseEndpoint: '/api/v1/events'
    }
  }

  const { VITE_SERVICE_ENV = 'dev' } = env

  return serviceConfigMap[VITE_SERVICE_ENV]
}

/**
 * Get proxy pattern of service url
 *
 * @param key If not set, will use the default key
 */
export function createProxyPattern(key?: App.Service.OtherBaseURLKey) {
  if (!key) {
    return '/proxy-default'
  }

  return `/proxy-${key}`
}

/**
 * Get SSE endpoint URL by current env
 *
 * @param env The current env
 */
export function getSSEEndpoint(env: Env.ImportMeta) {
  const serviceConfig = createServiceConfig(env)
  return serviceConfig.sseEndpoint
}
