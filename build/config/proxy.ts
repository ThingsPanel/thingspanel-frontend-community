
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

  // ThingsVis API 代理 (从环境变量获取，默认8000)
  const thingsvisApiUrl = env.VITE_THINGSVIS_API_URL || 'http://localhost:8000';
  proxy['/thingsvis-api'] = {
    target: thingsvisApiUrl,
    changeOrigin: true,
    rewrite: path => path.replace(/^\/thingsvis-api/, '/api/v1')
  }

  // Important: ThingsVis 前端代理 (新增)
  // 将 /thingsvis/* 请求转发到本地开发的 Studio 服务
  // 这解决了 "Iframe 加载 ThingsPanel 自身页面" 的问题
  let studioHost = 'http://localhost:3000';
  try {
    if (env.VITE_THINGSVIS_STUDIO_URL) {
      studioHost = new URL(env.VITE_THINGSVIS_STUDIO_URL).origin;
    }
  } catch (e) { }

  proxy['/thingsvis'] = {
    target: studioHost,
    changeOrigin: true,
    rewrite: path => path.replace(/^\/thingsvis/, '')
  }

  return proxy
}
