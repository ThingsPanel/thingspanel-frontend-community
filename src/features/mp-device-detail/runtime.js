// Derived from ThingsPanel/app 74e0509; requests and sockets run inside this H5 page.
import { createSocket } from './socket.js'
import {
  rowsOf,
  extractDeviceFields,
  parseDeviceSchema,
  normalizeDeviceValues,
  normalizeDeviceWrite,
  collectDeviceHistoryConfigs,
  normalizeHistoryRows
} from './schema.js'

export function createDeviceRuntime({ device, deviceId, addresses, onMessage, onState, context, model, dataOnly }) {
  let stopped = false
  let schema,
    fields = [],
    initPayload,
    latest = {},
    loaded = false
  let latestLoaded = false,
    realtimeSocketOpened = false
  const sockets = new Set(),
    timers = new Set(),
    writes = new Map()
  const initialHistory = new Map()
  const historyCache = new Map(),
    historyPending = new Map(),
    historyVersions = new Map()
  let historyWarning = ''
  const token = context.session.token
  const emit = (message) => {
    if (!stopped) onMessage(message)
  }
  const state = (status, message = '') => {
    if (!stopped) onState({ status, message })
  }
  const push = (values) => {
    if (stopped) return
    values = { ...values }
    fields.forEach((field) => {
      if (values[field.id] === undefined && values[field.name] !== undefined) values[field.id] = values[field.name]
    })
    // 重复的首值/心跳不应驱动整个历史缓冲重新比较和渲染。
    values = Object.fromEntries(
      Object.entries(values).filter(
        ([key, value]) =>
          !Object.is(latest[key], value) &&
          (typeof value !== 'object' || JSON.stringify(latest[key]) !== JSON.stringify(value))
      )
    )
    if (!Object.keys(values).length) return
    latest = { ...latest, ...values }
    if (loaded) emit({ type: 'tv:platform-data', payload: { fields: values, deviceId } })
  }
  const report = (error) => state(loaded ? 'warning' : 'error', error?.message || '设备数据加载失败')
  const api = async (path, data, method) => {
    if (stopped) throw new Error('设备页面已关闭')
    const value = await context.api(path, data, method)
    if (stopped) throw new Error('设备页面已关闭')
    return value
  }
  async function fetchLatest() {
    const values = await Promise.all([
      api(`telemetry/datas/current/${encodeURIComponent(deviceId)}`),
      fields.some((field) => field.dataType === 'attribute')
        ? api(`attribute/datas/${encodeURIComponent(deviceId)}`)
        : Promise.resolve([])
    ])
    const raw = Object.assign({}, ...values.map(normalizeDeviceValues))
    const mapped = { ...raw }
    fields.forEach((field) => {
      if (raw[field.id] === undefined && raw[field.name] !== undefined) mapped[field.id] = raw[field.name]
    })
    push(mapped)
    latestLoaded = true
  }
  async function fetchAlarms() {
    const eventFields = fields.filter((field) => field.dataType === 'event')
    if (!eventFields.length) return
    const result = await api('alarm/info/history/device', { device_id: deviceId })
    const values = {}
    eventFields.forEach((field) => {
      const alarm = rowsOf(result).find((item) => item.alarm_name === field.id || item.key === field.id)
      if (alarm)
        values[field.id] = {
          active: alarm.is_active ?? false,
          level: alarm.alarm_level,
          message: alarm.alarm_description,
          time: alarm.last_trigger_time
        }
    })
    push(values)
  }
  function connect(path, statusOnly = false) {
    if (stopped) return
    let heartbeat,
      reconnecting = false
    const socket = createSocket(`${addresses.thingsPanelApiBase.replace(/^http/, 'ws')}/${path}`)
    sockets.add(socket)
    const reconnect = (alreadyClosed = false) => {
      if (reconnecting || stopped) return
      reconnecting = true
      clearInterval(heartbeat)
      timers.delete(heartbeat)
      sockets.delete(socket)
      if (!alreadyClosed) socket.close({ code: 1000 })
      state('warning', '实时连接中断，正在重连')
      const timer = setTimeout(() => {
        timers.delete(timer)
        connect(path, statusOnly)
      }, 3000)
      timers.add(timer)
    }
    socket.onOpen(() => {
      if (stopped) {
        socket.close({ code: 1000 })
        return
      }
      socket.send({ data: JSON.stringify({ device_id: deviceId, token }), fail: reconnect })
      // 首次连接复用启动时的首值；断线重连后再补读可能错过的属性。
      if (!statusOnly) {
        const reopened = realtimeSocketOpened
        realtimeSocketOpened = true
        if (reopened || !latestLoaded) fetchLatest().catch(report)
      }
      heartbeat = setInterval(() => socket.send({ data: 'ping', fail: reconnect }), 8000)
      timers.add(heartbeat)
      if (loaded) state('warning', historyWarning)
    })
    socket.onMessage((event) => {
      if (stopped || event.data === 'pong' || event.data === 'ping') return
      try {
        const value = JSON.parse(event.data)
        if (statusOnly) {
          if (typeof value.is_online === 'number')
            push({
              is_online: value.is_online,
              online_text: value.is_online === 1 ? '在线' : '离线',
              online_status_updated_at: Date.now()
            })
        } else push(normalizeDeviceValues(value))
      } catch {
        state('warning', '收到无法解析的实时数据')
      }
    })
    socket.onError(() => reconnect())
    socket.onClose(() => reconnect(true))
  }
  async function start() {
    state('loading', '正在加载设备可视化')
    if (!token) throw new Error('登录状态已失效，请重新登录')
    // Board channels share this runtime without loading a device canvas or authenticating again.
    if (dataOnly) {
      schema = dataOnly.schema
      fields = model.fields
      initPayload = {}
      push({ is_online: device.is_online, online_text: device.is_online === 1 ? '在线' : '离线' })
      await fetchLatest()
      await Promise.all([fetchAlarms(), history({})]).catch((error) => {
        historyWarning = error.message
        report(error)
      })
      return { fields }
    }
    if (!model?.config) {
      state('empty', '尚未配置移动端设备可视化')
      return null
    }
    fields = model.fields
    schema = parseDeviceSchema(model.config, deviceId, fields)
    if (!schema.nodes.length) {
      state('empty', '移动端可视化尚未添加组件')
      return null
    }
    const user = await api('user/detail')
    const id = user.userId || user.id
    if (!id) throw new Error('无法获取当前用户身份')
    const sysAdmin = user.authority === 'SYS_ADMIN' || user.roles?.includes('SYS_ADMIN')
    const sso = await context.request(
      '/thingsvis-api/auth/sso',
      {
        platform: 'thingspanel',
        platformToken: token,
        userInfo: {
          id,
          email: user.email || `${user.userName}@thingspanel.local`,
          name: user.userName || 'ThingsPanel User',
          tenantId: sysAdmin ? 'thingspanel-sys-admin' : String(user.tenantId || user.tenant_id || 'default')
        },
        role: sysAdmin ? 'SUPER_ADMIN' : user.authority === 'TENANT_ADMIN' ? 'TENANT_ADMIN' : 'EDITOR'
      },
      'POST',
      true
    )
    if (!sso?.accessToken) throw new Error('ThingsVis 认证失败，请重新进入设备')
    if (stopped) return null
    initPayload = {
      platformDevices: [{ deviceId, deviceName: device.name || device.device_number || deviceId, fields }],
      data: { ...schema, platformFields: fields },
      config: {
        saveTarget: 'host',
        thingsvisApiBaseUrl: addresses.thingsVisApiBase,
        platformApiBaseUrl: addresses.thingsPanelApiBase,
        platformToken: token,
        deviceId
      }
    }
    push({ is_online: device.is_online, online_text: device.is_online === 1 ? '在线' : '离线' })
    await fetchLatest()
    await fetchAlarms()
    // 首屏先准备历史数据，避免实时值被图表缓冲成一段临时曲线。
    await history({}).catch((error) => {
      historyWarning = error.message
      report(error)
    })
    if (stopped) return null
    const base = addresses.thingsVisPageUrl.split('#')[0]
    const params = {
      mode: 'embedded',
      provider: 'thingspanel',
      saveTarget: 'host',
      context: 'current-device',
      embedSizing: 'content',
      thingsvisApiBaseUrl: addresses.thingsVisApiBase,
      platformApiBaseUrl: addresses.thingsPanelApiBase,
      token: sso.accessToken
    }
    const url = `${base}#/embed?${Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')}`
    return { url, initPayload, canvas: schema.canvas }
  }
  async function history(payload) {
    const requests = collectDeviceHistoryConfigs(schema, payload)
    async function loadField([id, config]) {
      if (!fields.some((field) => field.id === id && field.dataType === 'telemetry')) return
      const query = {
        device_id: deviceId,
        key: id,
        time_range: config.timeRange,
        aggregate_window: config.aggWindow,
        aggregate_function: config.aggFunction
      }
      const signature = JSON.stringify(query)
      const cached = historyCache.get(signature)
      if (cached && Date.now() - cached.time < 5000) {
        historyVersions.set(id, signature)
        if (loaded) emit({ type: 'tv:platform-history', payload: cached.payload })
        return
      }
      historyVersions.set(id, signature)
      if (historyPending.has(signature)) {
        await historyPending.get(signature)
        return
      }
      const task = (async () => {
        const result = await api('telemetry/datas/statistic', query)
        const rows = normalizeHistoryRows(result)
        const historyPayload = { fieldId: id, history: rows, deviceId, bufferLimit: rows.length }
        initialHistory.set(id, historyPayload)
        historyCache.set(signature, { time: Date.now(), payload: historyPayload })
        if (historyCache.size > 64) historyCache.delete(historyCache.keys().next().value)
        if (loaded && historyVersions.get(id) === signature)
          emit({ type: 'tv:platform-history', payload: historyPayload })
        // 历史只走专用协议，不能作为普通实时字段进入嵌套缓冲。
      })()
      historyPending.set(signature, task)
      try {
        await task
      } finally {
        historyPending.delete(signature)
      }
    }
    // 限制单设备并发，避免多字段历史逐个等待，也避免瞬间发出全部请求。
    const entries = [...requests]
    let failure
    for (let offset = 0; offset < entries.length && !stopped; offset += 4) {
      const results = await Promise.allSettled(entries.slice(offset, offset + 4).map(loadField))
      failure ||= results.find((result) => result.status === 'rejected')
    }
    if (failure) throw failure.reason
    return entries.length > 0
  }
  async function handleMessage(message) {
    if (stopped || !initPayload || !message) return
    const payload = message.payload || {}
    if (message.type === 'tv:error' || message.type === 'ERROR') {
      state(loaded ? 'warning' : 'error', payload.message || payload.error || '设备可视化运行异常')
      return
    }
    if (['READY', 'tv:ready', 'thingsvis:editor-ready', 'tv:request-init'].includes(message.type)) {
      emit({ type: 'tv:init', payload: initPayload })
      return
    }
    if (['LOADED', 'tv:loaded'].includes(message.type)) {
      const firstLoad = !loaded
      loaded = true
      // LOADED 早于平台数据源就绪。历史留到 requestFieldData 回填，避免同一份
      // 大数组在首屏被发送两次；实时首值也要在历史之后进入缓冲。
      if (!initialHistory.size) emit({ type: 'tv:platform-data', payload: { fields: latest, deviceId } })
      state('ready')
      if (historyWarning) state('warning', historyWarning)
      if (firstLoad) {
        connect('telemetry/datas/current/ws')
        connect('device/online/status/ws', true)
        const timer = setInterval(() => fetchAlarms().catch(report), 30000)
        timers.add(timer)
      }
      return
    }
    if (message.type === 'tv:platform-write') {
      const requestId = message.requestId
      if (typeof requestId !== 'string' || !requestId) return
      if (!writes.has(requestId)) {
        writes.set(
          requestId,
          (async () => {
            try {
              if (payload.deviceId && payload.deviceId !== deviceId) throw new Error('不能控制当前页面以外的设备')
              // EmbedPage 为 platformDevices 自动补充同名平台数据源。
              if (
                payload.dataSourceId !== `__platform_${deviceId}__` &&
                !schema.dataSources.some(
                  (source) =>
                    source.id === payload.dataSourceId &&
                    ['PLATFORM_FIELD', 'PLATFORM'].includes(String(source.type).toUpperCase())
                )
              )
                throw new Error('控制数据源无效')
              if (
                model.native &&
                Object.keys(payload.data || {}).some(
                  (key) => !fields.some((field) => field.id === key && field.dataType === 'command')
                )
              )
                throw new Error('该字段只读，请使用设备命令')
              const write = normalizeDeviceWrite(payload.data, fields)
              const data =
                write.kind === 'command'
                  ? {
                      device_id: deviceId,
                      identify: Object.keys(write.data)[0],
                      value: JSON.stringify(Object.values(write.data)[0] ?? {})
                    }
                  : { device_id: deviceId, value: JSON.stringify(write.data) }
              const echo = await api(`${write.kind}/datas/pub`, data, 'POST')
              return { type: 'tv:platform-write-result', requestId, success: true, echo }
            } catch (error) {
              return { type: 'tv:platform-write-result', requestId, success: false, error: error.message }
            }
          })()
        )
      }
      emit(await writes.get(requestId))
      return
    }
    if (message.type === 'thingsvis:requestFieldData') {
      if (payload.deviceId && payload.deviceId !== deviceId) return
      try {
        const queried = await history(payload)
        if (queried && historyWarning) {
          historyWarning = ''
          state('warning', '')
        }
        emit({ type: 'tv:platform-data', payload: { fields: latest, deviceId } })
      } catch (error) {
        historyWarning = error.message
        report(error)
        emit({ type: 'tv:platform-data', payload: { fields: latest, deviceId } })
      }
    }
  }
  function stop() {
    stopped = true
    timers.forEach((timer) => {
      clearTimeout(timer)
      clearInterval(timer)
    })
    timers.clear()
    sockets.forEach((socket) => socket.close({ code: 1000 }))
    sockets.clear()
    writes.clear()
    historyCache.clear()
    historyPending.clear()
    historyVersions.clear()
    initialHistory.clear()
  }
  return { start, handleMessage, stop }
}
