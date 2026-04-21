/**
 * useRealtimePush — tp-03
 * 使用 WebSocket 订阅设备遥测实时数据并推送到 ThingsVis。
 * 仅走 WS 通道；连接异常时自动重连。
 *
 * WS 端点：/api/v1/telemetry/datas/current/ws
 * 协议流程：
 *   1. 建立连接
 *   2. 客户端发送认证消息 { device_id, token }
 *   3. 服务端首先返回当前遥测属性
 *   4. 随后设备有推送便自动返回新数据
 *   5. 返回数据格式：{"humidity":5,"systime":"...","temperature":16.27}
 *   6. 客户端需发 ping 保持连接（间隔 < 60s）
 */

import { type Ref, ref } from 'vue'
import type { PlatformField } from '@/utils/thingsvis/types'
import { localStg } from '@/utils/storage'
import { getWebsocketServerUrl } from '@/utils/common/tool'

/** ping 间隔。服务端心跳窗口较短，需与现有稳定模块保持一致（8s）。 */
const PING_INTERVAL_MS = 8_000
const WS_RECONNECT_DELAY_MS = 3000

/**
 * 构建遥测 WebSocket URL
 *
 * 统一复用项目已有的 websocket 基地址，避免与 request/baseURL、代理前缀不一致。
 */
function buildTelemetryWsUrl(): string {
  return `${getWebsocketServerUrl()}/telemetry/datas/current/ws`
}

function buildDeviceStatusWsUrl(): string {
  return `${getWebsocketServerUrl()}/device/online/status/ws`
}

function extractFields(payload: unknown): Record<string, unknown> {
  const normalizeFlatObject = (obj: Record<string, unknown>) => {
    const fields: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'systime') continue
      fields[k] = v
    }
    return fields
  }

  if (!payload) return {}

  if (Array.isArray(payload)) {
    const fields: Record<string, unknown> = {}
    payload.forEach(item => {
      if (!item || typeof item !== 'object') return
      const key = (item as any).key ?? (item as any).label
      if (!key || key === 'systime') return
      if ((item as any).value !== undefined) fields[key] = (item as any).value
    })
    return fields
  }

  if (typeof payload !== 'object') return {}
  const obj = payload as Record<string, unknown>

  if (obj.fields && typeof obj.fields === 'object' && !Array.isArray(obj.fields)) {
    return normalizeFlatObject(obj.fields as Record<string, unknown>)
  }

  if (obj.data !== undefined) {
    return extractFields(obj.data)
  }

  if (obj.payload !== undefined) {
    return extractFields(obj.payload)
  }

  return normalizeFlatObject(obj)
}

export function useRealtimePush(
  deviceId: Ref<string>,
  platformFields: Ref<PlatformField[]>,
  /** 推送单批次字段值到 ThingsVis */
  pushData: (fields: Record<string, unknown>) => void,
  /** 建连后拉一帧当前值，避免等待下一条 WS 才更新 */
  fetchLatest: () => Promise<void>
) {
  let ws: WebSocket | null = null
  let statusWs: WebSocket | null = null
  let pingTimer: ReturnType<typeof setInterval> | null = null
  let statusPingTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let statusReconnectTimer: ReturnType<typeof setTimeout> | null = null
  let destroyed = false
  let loggedFirstBusinessFrame = false
  let loggedFirstStatusFrame = false
  let warnedUnmappedPayload = false
  let businessFrameCount = 0
  const usingWebSocket = ref(false)

  const mapToPlatformFieldIds = (rawFields: Record<string, unknown>): { fields: Record<string, unknown>; matched: boolean } => {
    const mapped: Record<string, unknown> = {}
    const fields = platformFields.value || []
    if (fields.length === 0) {
      return { fields: rawFields, matched: false }
    }

    fields.forEach(field => {
      const idVal = rawFields[field.id]
      const nameVal = rawFields[field.name]
      if (idVal !== undefined) {
        mapped[field.id] = idVal
      } else if (nameVal !== undefined) {
        mapped[field.id] = nameVal
      }
    })

    // Fallback: if no mapping matched, keep the original payload to avoid dropping data.
    if (Object.keys(mapped).length === 0) {
      return { fields: rawFields, matched: false }
    }
    return { fields: mapped, matched: true }
  }

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (statusReconnectTimer) {
      clearTimeout(statusReconnectTimer)
      statusReconnectTimer = null
    }
  }

  const scheduleReconnect = () => {
    clearReconnectTimer()
    reconnectTimer = setTimeout(() => {
      if (!destroyed) {
        startWebSocket()
      }
    }, WS_RECONNECT_DELAY_MS)
    statusReconnectTimer = setTimeout(() => {
      if (!destroyed) {
        startStatusWebSocket()
      }
    }, WS_RECONNECT_DELAY_MS)
  }

  const stopWebSocket = () => {
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
    if (statusPingTimer) {
      clearInterval(statusPingTimer)
      statusPingTimer = null
    }
    clearReconnectTimer()
    if (ws) {
      ws.onclose = null
      ws.close()
      ws = null
    }
    if (statusWs) {
      statusWs.onclose = null
      statusWs.close()
      statusWs = null
    }
    usingWebSocket.value = false
  }

  const startWebSocket = () => {
    if (destroyed) return
    stopWebSocket()
    clearReconnectTimer()

    const token = localStg.get('token') as string | undefined
    if (!token) {
      console.warn('[useRealtimePush] No auth token, retrying websocket later')
      scheduleReconnect()
      return
    }

    try {
      const wsUrl = buildTelemetryWsUrl()
      ws = new WebSocket(wsUrl)
    } catch (err) {
      console.warn('[useRealtimePush] WebSocket init failed, retrying:', err)
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      if (!ws) return
      usingWebSocket.value = true
      clearReconnectTimer()
      loggedFirstBusinessFrame = false
      warnedUnmappedPayload = false
      businessFrameCount = 0
      console.info('[useRealtimePush] Telemetry WS connected', { deviceId: deviceId.value, url: ws.url })

      // 连接后发送认证消息：device_id + token
      ws.send(
        JSON.stringify({
          device_id: deviceId.value,
          token
        })
      )
      fetchLatest().catch(console.error)

      // 保持连接：ping 间隔 < 60s
      pingTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, PING_INTERVAL_MS)
    }

    ws.onmessage = event => {
      if (typeof event.data !== 'string' || event.data === 'pong') return
      try {
        const msg = JSON.parse(event.data)
        const rawFields = extractFields(msg)
        if (Object.keys(rawFields).length > 0) {
          businessFrameCount += 1
          const { fields: mappedFields, matched } = mapToPlatformFieldIds(rawFields)
          if (!loggedFirstBusinessFrame) {
            loggedFirstBusinessFrame = true
            console.info('[useRealtimePush] First telemetry frame received', {
              rawKeys: Object.keys(rawFields).slice(0, 12),
              mappedKeys: Object.keys(mappedFields).slice(0, 12)
            })
          }
          if (import.meta.env.DEV && businessFrameCount % 10 === 0) {
            console.info('[useRealtimePush] Telemetry frame progress', {
              count: businessFrameCount,
              lastRawKeys: Object.keys(rawFields).slice(0, 12),
              lastMappedKeys: Object.keys(mappedFields).slice(0, 12)
            })
          }
          if (!warnedUnmappedPayload && !matched) {
            warnedUnmappedPayload = true
            console.warn('[useRealtimePush] Telemetry payload did not map to platformFields', {
              rawKeys: Object.keys(rawFields).slice(0, 12),
              fieldIds: platformFields.value.map(f => f.id).slice(0, 12),
              fieldNames: platformFields.value.map(f => f.name).slice(0, 12)
            })
          }
          pushData(mappedFields)
        }
      } catch {
        // 非 JSON 帧，忽略
      }
    }

    ws.onerror = (event) => {
      console.warn('[useRealtimePush] WebSocket error:', event)
    }

    ws.onclose = event => {
      if (destroyed) return
      usingWebSocket.value = false
      if (pingTimer) {
        clearInterval(pingTimer)
        pingTimer = null
      }
      console.warn('[useRealtimePush] WebSocket closed:', { code: event.code, reason: event.reason })
      scheduleReconnect()
    }
  }

  const startStatusWebSocket = () => {
    if (destroyed) return

    const token = localStg.get('token') as string | undefined
    if (!token) {
      console.warn('[useRealtimePush] No auth token for status websocket, retrying later')
      scheduleReconnect()
      return
    }

    try {
      const wsUrl = buildDeviceStatusWsUrl()
      statusWs = new WebSocket(wsUrl)
    } catch (err) {
      console.warn('[useRealtimePush] Status WebSocket init failed, retrying:', err)
      scheduleReconnect()
      return
    }

    statusWs.onopen = () => {
      if (!statusWs) return
      clearReconnectTimer()
      loggedFirstStatusFrame = false
      console.info('[useRealtimePush] Device status WS connected', { deviceId: deviceId.value, url: statusWs.url })

      statusWs.send(
        JSON.stringify({
          device_id: deviceId.value,
          token
        })
      )

      statusPingTimer = setInterval(() => {
        if (statusWs?.readyState === WebSocket.OPEN) {
          statusWs.send('ping')
        }
      }, PING_INTERVAL_MS)
    }

    statusWs.onmessage = event => {
      if (typeof event.data !== 'string' || event.data === 'pong') return
      try {
        const msg = JSON.parse(event.data) as Record<string, unknown>
        if (typeof msg.is_online !== 'number') return

        if (!loggedFirstStatusFrame) {
          loggedFirstStatusFrame = true
          console.info('[useRealtimePush] First device status frame received', { is_online: msg.is_online })
        }

        pushData({
          is_online: msg.is_online,
          online_text: msg.is_online === 1 ? '在线' : '离线',
          online_status_updated_at: Date.now()
        })
      } catch {
        // ignore non-JSON frames
      }
    }

    statusWs.onerror = (event) => {
      console.warn('[useRealtimePush] Device status WebSocket error:', event)
    }

    statusWs.onclose = event => {
      if (destroyed) return
      if (statusPingTimer) {
        clearInterval(statusPingTimer)
        statusPingTimer = null
      }
      console.warn('[useRealtimePush] Device status WebSocket closed:', { code: event.code, reason: event.reason })
      scheduleReconnect()
    }
  }

  const start = () => {
    destroyed = false
    clearReconnectTimer()
    startWebSocket()
    startStatusWebSocket()
  }

  const stop = () => {
    destroyed = true
    clearReconnectTimer()
    stopWebSocket()
  }

  return { start, stop, usingWebSocket }
}
