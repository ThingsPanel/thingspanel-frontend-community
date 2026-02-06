import type { ProxyOptions } from 'vite'
import { createProxyPattern, createServiceConfig } from '../../env.config'

/**
 * Set http proxy
 *
 * @param env - The current env
 */
export function createViteProxy(env: Env.ImportMeta) {
  const isEnableHttpProxy = env.VITE_HTTP_PROXY === 'Y'

  if (!isEnableHttpProxy) return undefined

  const { baseURL, otherBaseURL } = createServiceConfig(env)

  const defaultProxyPattern = createProxyPattern()

  const proxy: Record<string, ProxyOptions> = {
    [defaultProxyPattern]: {
      target: baseURL,
      changeOrigin: true,
      rewrite: path => path.replace(new RegExp(`^${defaultProxyPattern}`), '')
    }
  }

  const otherURLEntries = Object.entries(otherBaseURL)

  for (const [key, url] of otherURLEntries) {
    const proxyPattern = createProxyPattern(key as App.Service.OtherBaseURLKey)

    proxy[proxyPattern] = {
      target: url,
      changeOrigin: true,
      rewrite: path => path.replace(new RegExp(`^${proxyPattern}`), '')
    }
  }

  // ThingsVis 独立代理 - 使用 /thingsvis-api 前缀，不与默认代理冲突
  proxy['/thingsvis-api'] = {
    target: 'http://localhost:3001',
    changeOrigin: true,
    rewrite: path => path.replace(/^\/thingsvis-api/, '/api/v1')
  }

  return proxy
}

