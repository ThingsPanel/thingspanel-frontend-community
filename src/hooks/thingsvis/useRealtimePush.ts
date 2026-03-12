/**
 * useRealtimePush — tp-03
 * 使用 WebSocket 订阅设备遥测实时数据并推送到 ThingsVis。
 * 若 WebSocket 连接失败或断开则自动回退到轮询。
 *
 * WS URL 从当前页面 origin 推导（HTTP→ws, HTTPS→wss），
 * 路径为 /api/v1/telemetry/datas/current/keys/ws
 */

import { type Ref, ref } from 'vue'
import type { PlatformField } from '@/utils/thingsvis/types'
import { localStg } from '@/utils/storage'

const PING_INTERVAL_MS = 8000
const POLLING_FALLBACK_INTERVAL_MS = 5000
const WS_RECONNECT_DELAY_MS = 3000

/**
 * 从当前页面 origin 推导 WebSocket 基础 URL
 * e.g. http://localhost:8080  →  ws://localhost:8080
 *      https://example.com   →  wss://example.com
 */
function getWsBaseUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}`
}

export function useRealtimePush(
  deviceId: Ref<string>,
  platformFields: Ref<PlatformField[]>,
  /** 推送单批次字段值到 ThingsVis */
  pushData: (fields: Record<string, unknown>) => void,
  /** 轮询回退时调用此函数获取最新状态 */
  fetchLatest: () => Promise<void>
) {
  let ws: WebSocket | null = null
  let pingTimer: ReturnType<typeof setInterval> | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let destroyed = false
  const usingWebSocket = ref(false)

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const startPolling = () => {
    stopPolling()
    usingWebSocket.value = false
    console.warn('[useRealtimePush] WebSocket unavailable — falling back to polling')
    fetchLatest().catch(console.error)
    pollTimer = setInterval(() => fetchLatest().catch(console.error), POLLING_FALLBACK_INTERVAL_MS)
  }

  const stopWebSocket = () => {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
    if (ws) {
      ws.onclose = null // 阻止 onclose 触发回退逻辑（主动关闭时）
      ws.close()
      ws = null
    }
    usingWebSocket.value = false
  }

  const startWebSocket = () => {
    if (destroyed) return
    stopWebSocket()

    const telemetryKeys = platformFields.value
      .filter(f => f.dataType === 'telemetry')
      .map(f => f.id)

    if (!telemetryKeys.length) {
      startPolling()
      return
    }

    const token = localStg.get('token') as string | undefined
    if (!token) {
      console.warn('[useRealtimePush] No auth token, falling back to polling')
      startPolling()
      return
    }

    try {
      const wsUrl = `${getWsBaseUrl()}/api/v1/telemetry/datas/current/keys/ws`
      ws = new WebSocket(wsUrl)
    } catch (err) {
      console.warn('[useRealtimePush] WebSocket init failed, falling back to polling:', err)
      startPolling()
      return
    }

    ws.onopen = () => {
      if (!ws) return
      usingWebSocket.value = true
      stopPolling()

      ws.send(JSON.stringify({
        device_id: deviceId.value,
        keys: telemetryKeys,
        token
      }))

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
        if (msg.key !== undefined && msg.value !== undefined) {
          pushData({ [msg.key]: msg.value })
        }
      } catch {
        // 非 JSON 帧，忽略
      }
    }

    ws.onerror = () => {
      console.warn('[useRealtimePush] WebSocket error')
    }

    ws.onclose = () => {
      if (destroyed) return
      usingWebSocket.value = false
      if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
      setTimeout(() => {
        if (!destroyed) startPolling()
      }, WS_RECONNECT_DELAY_MS)
    }
  }

  const start = () => {
    destroyed = false
    startWebSocket()
  }

  const stop = () => {
    destroyed = true
    stopWebSocket()
    stopPolling()
  }

  return { start, stop, usingWebSocket }
}
