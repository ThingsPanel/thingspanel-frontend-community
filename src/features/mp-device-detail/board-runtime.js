import { createDeviceRuntime } from './runtime.js'
import { prepareBoardSchema } from './board-schema.js'
import { collectDeviceHistory } from './schema.js'
import { loadDeviceModel } from './model.js'
import { createApi } from './session.js'

// Same host protocol as the App board viewer, with tab-scoped H5 credentials.
export function createBoardRuntime({ context, addresses, onMessage, onState }) {
  let stopped = false,
    prepared,
    loaded = false
  const channels = new Map(),
    pending = new Map()
  const session = context.session
  const vis = createApi({ ...session, token: session.visToken })
  const emit = (message) => {
    if (!stopped) onMessage(message)
  }
  const state = (status, message = '') => {
    if (!stopped) onState({ status, message })
  }
  async function start() {
    const dashboard = await vis.request(
      `/thingsvis-api/dashboards/${encodeURIComponent(session.boardId)}`,
      null,
      'GET',
      true
    )
    if (stopped) return null
    prepared = prepareBoardSchema(dashboard.data || dashboard)
    for (const source of prepared.schema.dataSources) {
      if (source.type === 'PLATFORM_FIELD' && collectDeviceHistory(prepared.schema, { dataSourceId: source.id }).size)
        source.config.bufferSize = Math.max(100, Number(source.config.bufferSize) || 0)
    }
    const params = {
      mode: 'embedded',
      context: 'dashboard',
      provider: 'thingspanel',
      saveTarget: 'host',
      toolbar: '0',
      hostLoading: '1',
      token: session.visToken,
      thingsvisApiBaseUrl: addresses.thingsVisApiBase,
      platformApiBaseUrl: addresses.thingsPanelApiBase
    }
    return {
      url: addresses.thingsVisPageUrl.split('#')[0] + '#/embed?' + new URLSearchParams(params),
      name: prepared.schema.meta.name,
      canvas: prepared.schema.canvas
    }
  }
  async function channel(deviceId) {
    if (stopped || !prepared.devices.has(deviceId)) throw new Error('设备不属于当前看板')
    if (!pending.has(deviceId))
      pending.set(
        deviceId,
        (async () => {
          const device = await context.api(`device/detail/${encodeURIComponent(deviceId)}`)
          if (stopped) return null
          const model = await loadDeviceModel(device, context, { dataOnly: true })
          if (stopped) return null
          const ids = prepared.devices.get(deviceId)
          const schema = {
            ...prepared.schema,
            dataSources: prepared.schema.dataSources.filter((source) => ids.includes(source.id))
          }
          const runtime = createDeviceRuntime({
            device,
            deviceId,
            addresses,
            context,
            model,
            dataOnly: { schema },
            onMessage: emit,
            onState: (value) => {
              if (value.message && ['warning', 'error'].includes(value.status)) state('warning', value.message)
            }
          })
          channels.set(deviceId, runtime)
          await runtime.start()
          if (stopped) {
            runtime.stop()
            return null
          }
          await runtime.handleMessage({ type: 'LOADED' })
          return runtime
        })().catch((error) => {
          channels.get(deviceId)?.stop()
          channels.delete(deviceId)
          pending.delete(deviceId)
          throw error
        })
      )
    return pending.get(deviceId)
  }
  async function handleMessage(message) {
    if (stopped || !prepared || !message) return
    const payload = message.payload || {}
    if (['READY', 'tv:ready', 'thingsvis:editor-ready', 'tv:request-init'].includes(message.type)) {
      emit({
        type: 'tv:init',
        payload: {
          data: prepared.schema,
          config: {
            mode: 'app',
            saveTarget: 'host',
            token: session.visToken,
            platformToken: session.token,
            thingsvisApiBaseUrl: addresses.thingsVisApiBase,
            platformApiBaseUrl: addresses.thingsPanelApiBase
          }
        }
      })
    } else if (['LOADED', 'tv:loaded'].includes(message.type)) {
      if (loaded) return
      loaded = true
      const results = await Promise.allSettled([...prepared.devices.keys()].map(channel))
      const failed = results.find((result) => result.status === 'rejected')
      if (failed) state('error', failed.reason.message)
      else state('ready')
    } else if (['thingsvis:requestFieldData', 'tv:platform-write'].includes(message.type)) {
      const source = prepared.schema.dataSources.find(
        (item) => item.id === payload.dataSourceId && item.type === 'PLATFORM_FIELD'
      )
      const id = source?.config.deviceId || payload.deviceId
      try {
        if (!id || !prepared.devices.has(id) || (payload.deviceId && source && payload.deviceId !== id))
          throw new Error('设备数据源不匹配')
        const runtime = await channel(id)
        await runtime?.handleMessage({ ...message, payload: { ...payload, deviceId: id } })
      } catch (error) {
        if (message.type === 'tv:platform-write')
          emit({ type: 'tv:platform-write-result', requestId: message.requestId, success: false, error: error.message })
        else state('warning', error.message)
      }
    }
  }
  function stop() {
    stopped = true
    vis.dispose()
    channels.forEach((runtime) => runtime.stop())
    channels.clear()
    pending.clear()
  }
  return { start, handleMessage, stop }
}
