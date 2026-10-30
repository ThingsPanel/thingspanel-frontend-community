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

  const proxy: Record<string, ProxyOptions> = {}
  const authTarget = env.VITE_AUTH_DEV_PROXY_TARGET?.trim()
  if (authTarget) {
    const target = new URL(authTarget)
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
    if (
      (!loopback && target.protocol !== 'https:') ||
      !['http:', 'https:'].includes(target.protocol) ||
      target.username ||
      target.password ||
      target.search ||
      target.hash ||
      !['', '/'].includes(target.pathname)
    ) {
      throw new Error('Authentication development proxy requires an HTTPS origin or HTTP loopback origin.')
    }
    // Match before the generic business proxy; retain one authentication owner.
    proxy[
      `^${defaultProxyPattern}/(?:auth/|login(?:$|\\?)|user/(?:detail|logout|refresh|transform)(?:$|\\?)|tenant/(?:setup-state|has-admin|super-admin/init|market-register|email/register)(?:$|\\?))`
    ] = {
      target: target.origin,
      changeOrigin: true,
      rewrite: path => path.replace(new RegExp(`^${defaultProxyPattern}`), '/api/v1')
    }
  }
  proxy[defaultProxyPattern] = {
    target: baseURL,
    changeOrigin: true,
    ws: true,
    rewrite: path => path.replace(new RegExp(`^${defaultProxyPattern}`), '')
  }

  // Native metadata APIs use their Encore contracts directly. Keep these
  // routes separate from the Community /api/v1 proxy; no DTO translation.
  const thingModelNativeURL = env.VITE_THINGMODEL_NATIVE_URL || 'http://127.0.0.1:14210'
  // Everything the native Encore services answer under /api/v2. Without a route here Vite answers 404
  // itself (nginx.conf in the release image carries the same list).
  for (const prefix of [
    'thing-models',
    'thing-model-commands',
    'devices',
    'device-access-templates',
    'device-groups',
    'device-group-tree',
    'device-statistics',
    'device-number-validations',
    'metadata-operations',
    'metadata-downloads',
    'reading-exports',
    'processing-script-tests',
    'file-assets',
    'connection-providers'
  ]) {
    proxy[`/api/v2/${prefix}`] = { target: thingModelNativeURL, changeOrigin: true }
  }

  // The automation owner shares the /v1 contract with the production Encore
  // gateway; development may target its isolated listener explicitly.
  const automationNativeURL = env.VITE_AUTOMATION_NATIVE_URL || thingModelNativeURL
  for (const prefix of [
    '/v1/device-automation',
    '/v1/device-configs',
    '/v1/rules',
    '/v1/rule-validation',
    '/v1/runs',
    '/v1/bindings',
    '/v1/alarms'
  ]) {
    proxy[prefix] = { target: automationNativeURL, changeOrigin: true }
  }

  // Explicit development-only, same-origin route to a split Encore service.
  // Credentials stay in the Authorization header; the target has no fallback.
  const notificationTarget = env.VITE_NOTIFICATION_DEV_PROXY_TARGET?.trim()
  if (notificationTarget) {
    const target = new URL(notificationTarget)
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
    if (
      !['http:', 'https:'].includes(target.protocol) ||
      (target.protocol === 'http:' && !loopback) ||
      target.username ||
      target.password ||
      target.search ||
      target.hash ||
      !['', '/'].includes(target.pathname)
    )
      throw new Error('Notification development proxy requires an HTTPS origin or HTTP loopback origin.')
    proxy['/notification-core'] = {
      target: target.origin,
      changeOrigin: true,
      rewrite: path => path.replace(/^\/notification-core/, '')
    }
  }

  // The automation engine is a separate Encore service. It is reached through a
  // same-origin development path so the browser keeps sending the ordinary
  // Authorization header and no CORS rule has to be invented for local work.
  // The target is required to be HTTPS or loopback: a plain-http target on a
  // real host would silently send tenant tokens in clear text.
  const automationTarget = env.VITE_AUTOMATION_DEV_PROXY_TARGET?.trim()
  if (automationTarget) {
    const target = new URL(automationTarget)
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
    const acceptable =
      (target.protocol === 'https:' || (target.protocol === 'http:' && loopback)) &&
      !target.username &&
      !target.password &&
      !target.search &&
      !target.hash &&
      ['', '/'].includes(target.pathname)
    if (!acceptable) throw new Error('Automation development proxy requires an HTTPS origin or HTTP loopback origin.')
    proxy['/automation-core'] = {
      target: target.origin,
      changeOrigin: true,
      rewrite: path => path.replace(/^\/automation-core/, '')
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
  const thingsvisApiUrl = env.VITE_THINGSVIS_API_URL || 'http://localhost:8000'
  proxy['/thingsvis-api'] = {
    target: thingsvisApiUrl,
    changeOrigin: true,
    rewrite: path => path.replace(/^\/thingsvis-api/, '/api/v1')
  }

  // ThingsVis uploaded assets (GLB/images) are stored on the ThingsVis server under /uploads.
  proxy['/uploads'] = {
    target: thingsvisApiUrl,
    changeOrigin: true
  }

  // Important: ThingsVis 前端代理 (新增)
  // 将 /thingsvis/* 请求转发到本地开发的 Studio 服务
  // 这解决了 "Iframe 加载 ThingsPanel 自身页面" 的问题
  let studioHost = 'http://localhost:3000'
  if (env.VITE_THINGSVIS_STUDIO_URL) {
    try {
      studioHost = new URL(env.VITE_THINGSVIS_STUDIO_URL).origin
    } catch {
      // ignore invalid URL, use default
    }
  }

  proxy['/thingsvis'] = {
    target: studioHost,
    changeOrigin: true,
    rewrite: path => path.replace(/^\/thingsvis/, '')
  }

  // account-service 代理 (account-service 运行在 Docker 8080，映射到 18081)
  // 请求: /api/account/* → http://localhost:18081/api/account/*
  const accountServiceUrl = env.VITE_ACCOUNT_SERVICE_URL || 'http://localhost:18081'
  proxy['/api/account'] = {
    target: accountServiceUrl,
    changeOrigin: true,
    rewrite: path => path.replace(/^\/api\/account/, '/api/account')
  }

  return proxy
}
