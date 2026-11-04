const SESSION_KEY = 'thingspanel:mp-device-session:v1'
const validTarget = (launch) =>
  launch?.kind === 'board'
    ? typeof launch.boardId === 'string' && !!launch.boardId && typeof launch.visToken === 'string' && !!launch.visToken
    : typeof launch?.deviceId === 'string' && !!launch.deviceId
function parseSession(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('登录信息无效，请返回小程序重新打开设备')
  }
}
export function readLaunch(raw, storage = sessionStorage) {
  const params = new URLSearchParams(raw || '')
  let launch
  if (params.has('launch')) {
    storage.removeItem(SESSION_KEY)
    launch = parseSession(params.get('launch'))
    if (!launch || typeof launch.token !== 'string' || !launch.token || !validTarget(launch))
      throw new Error('登录信息无效，请返回小程序重新打开设备')
    launch = {
      token: launch.token,
      lang: launch.lang || 'zh-CN',
      createdAt: Date.now(),
      ...(launch.kind === 'board'
        ? { kind: 'board', boardId: launch.boardId, visToken: launch.visToken }
        : { deviceId: launch.deviceId })
    }
    storage.setItem(SESSION_KEY, JSON.stringify(launch))
  } else {
    launch = parseSession(storage.getItem(SESSION_KEY) || 'null')
  }
  if (
    typeof launch?.token !== 'string' ||
    !launch.token ||
    !validTarget(launch) ||
    !Number.isFinite(launch.createdAt) ||
    Date.now() - launch.createdAt > 2 * 3600000
  ) {
    storage.removeItem(SESSION_KEY)
    throw new Error('登录状态已失效，请返回小程序重新打开设备')
  }
  return launch
}

export function createApi(session, { fetchImpl = fetch, origin = location.origin } = {}) {
  const controllers = new Set()
  let stopped = false
  async function request(path, data, method = 'GET', raw = false) {
    if (stopped) throw new Error('页面已关闭')
    // All authenticated requests remain on the deployment that served this page.
    if (!/^\/(api\/v[12]\/|thingsvis-api\/)/.test(path) || path.includes('..')) throw new Error('无效的接口地址')
    const url = new URL(path, origin)
    if (url.origin !== new URL(origin).origin || !/^\/(api\/v[12]\/|thingsvis-api\/)/.test(url.pathname))
      throw new Error('无效的接口地址')
    if (method === 'GET')
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value != null) url.searchParams.set(key, String(value))
      })
    const controller = new AbortController()
    controllers.add(controller)
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const response = await fetchImpl(url, {
        method,
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          'x-token': session.token,
          Authorization: `Bearer ${session.token}`,
          'Accept-Language': session.lang
        },
        ...(method === 'GET' ? {} : { body: data == null ? undefined : JSON.stringify(data) })
      })
      if (response.status === 401 || response.status === 403)
        throw new Error(response.status === 401 ? '登录已失效，请返回小程序重新进入' : '当前账号无权执行此操作')
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || body.msg || '服务请求失败')
      if (raw) return body
      if (Number(body.code) !== 200) throw new Error(body.message || body.msg || '服务请求失败')
      return body.data
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('请求超时，请重试')
      throw error
    } finally {
      clearTimeout(timeout)
      controllers.delete(controller)
    }
  }
  return {
    session,
    request,
    api: (path, data, method) => request('/api/v1/' + path.replace(/^\/+/, ''), data, method),
    dispose() {
      stopped = true
      controllers.forEach((controller) => controller.abort())
      controllers.clear()
    }
  }
}
