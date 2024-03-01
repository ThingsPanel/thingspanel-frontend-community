/**
 * Create service config by current env
 *
 * @param env The current env
 */
export function createServiceConfig(env: Env.ImportMeta) {
  const mockURL = 'https://mock.apifox.com/m1/4080832-0-default';
  const devURL = 'http://23.94.59.38:9999/api/v1';
  const testURL = '';
  const prodURL = 'http://23.94.59.38:9999/api/v1';
  const serviceConfigMap: App.Service.ServiceConfigMap = {
    dev: {
      baseURL: devURL,
      otherBaseURL: {
        demo: devURL,
        mock: mockURL
      }
    },
    test: {
      baseURL: mockURL,
      otherBaseURL: {
        demo: testURL,
        mock: mockURL
      }
    },
    prod: {
      baseURL: devURL,
      otherBaseURL: {
        demo: prodURL,
        mock: mockURL
      }
    }
  };

  const { VITE_SERVICE_ENV = 'dev' } = env;

  return serviceConfigMap[VITE_SERVICE_ENV];
}

/**
 * Get proxy pattern of service url
 *
 * @param key If not set, will use the default key
 */
export function createProxyPattern(key?: App.Service.OtherBaseURLKey) {
  if (!key) {
    return '/proxy-default';
  }

  return `/proxy-${key}`;
}
