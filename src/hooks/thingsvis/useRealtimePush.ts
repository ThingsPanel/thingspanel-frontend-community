/**
 * useRealtimePush — tp-03
 * 使用 WebSocket 订阅设备遥测实时数据并推送到 ThingsVis。
 * 若 WebSocket 连接失败或断开则自动回退到轮询。
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

/** ping 间隔，需 < 60s 以保持连接 */
const PING_INTERVAL_MS = 25_000
const POLLING_FALLBACK_INTERVAL_MS = 5000
const WS_RECONNECT_DELAY_MS = 3000

/**
 * 构建遥测 WebSocket URL
 *
 * 开发环境：走 Vite 的 /proxy-default 代理（需在 proxy.ts 中配置 ws:true）
 *   例如 ws://localhost:5002/proxy-default/telemetry/datas/current/ws
 *   代理会去掉 /proxy-default 前缀并转发到后端
 *
 * 生产环境：前端与 API 同域（nginx 反代），直接使用 /api/v1 路径
 *   例如 wss://example.com/api/v1/telemetry/datas/current/ws
 */
function buildTelemetryWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = window.location.host

  // 开发环境走 Vite 代理 — 代理配置会 rewrite 掉 /proxy-default 前缀
  if (import.meta.env.DEV) {
    return `${proto}://${host}/proxy-default/telemetry/datas/current/ws`
  }

  // 生产环境直连
  return `${proto}://${host}/api/v1/telemetry/datas/current/ws`
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
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
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

    const token = localStg.get('token') as string | undefined
    if (!token) {
      console.warn('[useRealtimePush] No auth token, falling back to polling')
      startPolling()
      return
    }

    try {
      const wsUrl = buildTelemetryWsUrl()
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

      // 连接后发送认证消息：device_id + token
      ws.send(
        JSON.stringify({
          device_id: deviceId.value,
          token
        })
      )

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
        // 服务端返回扁平对象：{"humidity":5,"systime":"...","temperature":16.27}
        // 过滤 systime 后推送所有字段
        if (typeof msg === 'object' && msg !== null && !Array.isArray(msg)) {
          const fields: Record<string, unknown> = {}
          for (const [k, v] of Object.entries(msg)) {
            if (k === 'systime') continue
            fields[k] = v
          }
          if (Object.keys(fields).length > 0) {
            pushData(fields)
          }
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
      if (pingTimer) {
        clearInterval(pingTimer)
        pingTimer = null
      }
      // WS 断开后回退到轮询
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
