/**
 * WebSocket配置管理 Composable
 * 专门处理WebSocket连接的配置、连接管理、心跳和重连逻辑
 */

import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { WebSocketConfigData, KeyValuePair, TestConnectionResponse, ValidationResult } from '../types'

// WebSocket配置选项接口
export interface UseWebSocketConfigOptions {
  /** 初始配置 */
  initialConfig?: Partial<WebSocketConfigData>
  /** 是否启用自动验证 */
  autoValidate?: boolean
  /** 验证延迟（毫秒） */
  validationDelay?: number
  /** 是否启用连接测试 */
  enableTesting?: boolean
  /** 是否启用消息日志 */
  enableMessageLog?: boolean
  /** 最大消息日志数量 */
  maxLogMessages?: number
}

// WebSocket连接状态接口
export interface WebSocketConnectionState {
  /** 连接状态 */
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  /** WebSocket实例 */
  instance: WebSocket | null
  /** 连接开始时间 */
  connectTime?: number
  /** 最后活动时间 */
  lastActivity?: number
  /** 重连次数 */
  reconnectAttempts: number
  /** 是否正在重连 */
  isReconnecting: boolean
  /** 连接错误信息 */
  error?: string
}

// 消息统计接口
export interface MessageStats {
  /** 发送消息数 */
  sentCount: number
  /** 接收消息数 */
  receivedCount: number
  /** 心跳发送数 */
  heartbeatCount: number
  /** 最后消息时间 */
  lastMessageTime?: number
  /** 平均消息大小 */
  avgMessageSize: number
}

// 消息日志接口
export interface MessageLog {
  /** 消息ID */
  id: string
  /** 消息类型 */
  type: 'sent' | 'received' | 'heartbeat' | 'system'
  /** 消息内容 */
  content: any
  /** 时间戳 */
  timestamp: number
  /** 消息大小 */
  size: number
  /** 格式化内容 */
  formatted?: string
}

/**
 * WebSocket配置管理 Composable
 */
export function useWebSocketConfig(options: UseWebSocketConfigOptions = {}) {
  const { t } = useI18n()

  // 默认选项
  const {
    autoValidate = true,
    validationDelay = 300,
    enableTesting = true,
    enableMessageLog = true,
    maxLogMessages = 100
  } = options

  // WebSocket配置状态
  const wsConfig = reactive<WebSocketConfigData>({
    url: '',
    protocols: [],
    headers: [],
    heartbeat: {
      enabled: true,
      interval: 30000,
      messageType: 'ping',
      customMessage: '',
      jsonMessage: ''
    },
    reconnect: {
      enabled: true,
      maxAttempts: 5,
      delay: 1000,
      exponentialBackoff: true,
      maxDelay: 30000
    },
    connectionTimeout: 10000,
    bufferSize: 1000,
    binaryType: 'arraybuffer',
    compression: false,
    ...options.initialConfig
  })

  // 连接状态管理
  const connectionState = reactive<WebSocketConnectionState>({
    status: 'disconnected',
    instance: null,
    reconnectAttempts: 0,
    isReconnecting: false
  })

  // 消息统计
  const messageStats = reactive<MessageStats>({
    sentCount: 0,
    receivedCount: 0,
    heartbeatCount: 0,
    avgMessageSize: 0
  })

  // 消息日志
  const messageLogs = ref<MessageLog[]>([])

  // 验证状态
  const validation = ref<ValidationResult | null>(null)

  // 定时器引用
  let heartbeatTimer: number | null = null
  let reconnectTimer: number | null = null
  let validationTimer: number | null = null

  // 计算属性
  const isUrlValid = computed(() => {
    if (!wsConfig.url) return false
    try {
      const url = new URL(wsConfig.url)
      return url.protocol === 'ws:' || url.protocol === 'wss:'
    } catch {
      return false
    }
  })

  const isConnected = computed(() => {
    return connectionState.status === 'connected' && connectionState.instance?.readyState === WebSocket.OPEN
  })

  const isConnecting = computed(() => {
    return connectionState.status === 'connecting' || connectionState.status === 'reconnecting'
  })

  const hasValidConfig = computed(() => {
    return !!(wsConfig.url && isUrlValid.value)
  })

  const enabledProtocols = computed(() => {
    return wsConfig.protocols.filter(protocol => protocol.enabled && protocol.key).map(protocol => protocol.key)
  })

  const enabledHeaders = computed(() => {
    return wsConfig.headers.filter(header => header.enabled && header.key && header.value)
  })

  const connectionDuration = computed(() => {
    if (!connectionState.connectTime || !isConnected.value) return 0
    return Date.now() - connectionState.connectTime
  })

  const connectionSummary = computed(() => {
    return {
      url: wsConfig.url,
      protocols: enabledProtocols.value,
      headersCount: enabledHeaders.value.length,
      heartbeatEnabled: wsConfig.heartbeat.enabled,
      reconnectEnabled: wsConfig.reconnect.enabled,
      status: connectionState.status,
      duration: connectionDuration.value,
      messageStats: messageStats
    }
  })

  /**
   * 连接WebSocket
   */
  const connect = async (): Promise<TestConnectionResponse> => {
    if (!enableTesting) {
      throw new Error(t('dataSource.websocket.testingDisabled'))
    }

    if (!hasValidConfig.value) {
      throw new Error(t('dataSource.websocket.configInvalid'))
    }

    // 关闭现有连接
    await disconnect()

    connectionState.status = 'connecting'
    connectionState.connectTime = Date.now()
    connectionState.error = undefined

    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      try {
        // 创建WebSocket连接
        const ws = new WebSocket(wsConfig.url, enabledProtocols.value)
        ws.binaryType = wsConfig.binaryType

        connectionState.instance = ws

        // 连接超时处理
        const timeoutId = setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.close()
            connectionState.status = 'error'
            connectionState.error = t('dataSource.websocket.connectionTimeout')

            reject({
              success: false,
              status: 0,
              statusText: 'Timeout',
              headers: {},
              data: null,
              responseTime: Date.now() - startTime,
              error: t('dataSource.websocket.connectionTimeout')
            })
          }
        }, wsConfig.connectionTimeout)

        // 连接成功
        ws.onopen = event => {
          clearTimeout(timeoutId)
          connectionState.status = 'connected'
          connectionState.connectTime = Date.now()
          connectionState.reconnectAttempts = 0

          addMessageLog('system', '连接已建立', event)

          // 开始心跳
          if (wsConfig.heartbeat.enabled) {
            startHeartbeat()
          }

          const response: TestConnectionResponse = {
            success: true,
            status: 101,
            statusText: 'Switching Protocols',
            headers: {},
            data: { connected: true, protocol: ws.protocol },
            responseTime: Date.now() - startTime
          }

          resolve(response)
        }

        // 消息接收
        ws.onmessage = event => {
          messageStats.receivedCount++
          messageStats.lastMessageTime = Date.now()
          connectionState.lastActivity = Date.now()

          addMessageLog('received', event.data, event.data)
          updateMessageStats(event.data)
        }

        // 连接关闭
        ws.onclose = event => {
          clearTimeout(timeoutId)
          stopHeartbeat()

          const wasConnected = connectionState.status === 'connected'
          connectionState.status = 'disconnected'
          connectionState.instance = null

          const message = event.wasClean
            ? t('dataSource.websocket.connectionClosed', { code: event.code, reason: event.reason })
            : t('dataSource.websocket.connectionLost')

          addMessageLog('system', message, { code: event.code, reason: event.reason, wasClean: event.wasClean })

          // 如果是异常断开且启用重连
          if (!event.wasClean && wsConfig.reconnect.enabled && wasConnected) {
            scheduleReconnect()
          }
        }

        // 连接错误
        ws.onerror = event => {
          clearTimeout(timeoutId)
          connectionState.status = 'error'
          connectionState.error = t('dataSource.websocket.connectionError')

          addMessageLog('system', connectionState.error, event)

          const response: TestConnectionResponse = {
            success: false,
            status: 0,
            statusText: 'Connection Error',
            headers: {},
            data: null,
            responseTime: Date.now() - startTime,
            error: connectionState.error
          }

          reject(response)
        }
      } catch (error: any) {
        connectionState.status = 'error'
        connectionState.error = error.message

        reject({
          success: false,
          status: 0,
          statusText: 'Error',
          headers: {},
          data: null,
          responseTime: Date.now() - startTime,
          error: error.message
        })
      }
    })
  }

  /**
   * 断开WebSocket连接
   */
  const disconnect = async (): Promise<void> => {
    stopHeartbeat()
    stopReconnect()

    if (connectionState.instance) {
      connectionState.instance.close(1000, '用户主动断开')
      connectionState.instance = null
    }

    connectionState.status = 'disconnected'
    connectionState.error = undefined
    connectionState.reconnectAttempts = 0
    connectionState.isReconnecting = false
  }

  /**
   * 发送消息
   */
  const sendMessage = (message: any): boolean => {
    if (!isConnected.value) {
      addMessageLog('system', '发送失败: WebSocket未连接')
      return false
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message)
      connectionState.instance!.send(messageStr)

      messageStats.sentCount++
      addMessageLog('sent', messageStr, message)
      updateMessageStats(messageStr)

      return true
    } catch (error: any) {
      addMessageLog('system', `发送消息失败: ${error.message}`, error)
      return false
    }
  }

  /**
   * 开始心跳
   */
  const startHeartbeat = () => {
    if (!wsConfig.heartbeat.enabled) return

    stopHeartbeat()

    heartbeatTimer = window.setInterval(() => {
      if (isConnected.value) {
        const heartbeatMessage = getHeartbeatMessage()
        const sent = sendMessage(heartbeatMessage)

        if (sent) {
          messageStats.heartbeatCount++
          addMessageLog('heartbeat', heartbeatMessage)
        }
      }
    }, wsConfig.heartbeat.interval)
  }

  /**
   * 停止心跳
   */
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  /**
   * 获取心跳消息
   */
  const getHeartbeatMessage = (): any => {
    switch (wsConfig.heartbeat.messageType) {
      case 'ping':
        return 'ping'
      case 'json':
        try {
          return JSON.parse(wsConfig.heartbeat.jsonMessage || '{"type":"ping"}')
        } catch {
          return { type: 'ping' }
        }
      case 'text':
        return 'heartbeat'
      case 'custom':
        return wsConfig.heartbeat.customMessage || 'ping'
      default:
        return 'ping'
    }
  }

  /**
   * 安排重连
   */
  const scheduleReconnect = () => {
    if (!wsConfig.reconnect.enabled || connectionState.reconnectAttempts >= wsConfig.reconnect.maxAttempts) {
      addMessageLog('system', '已达到最大重连次数，停止重连')
      return
    }

    connectionState.isReconnecting = true
    connectionState.status = 'reconnecting'
    connectionState.reconnectAttempts++

    // 计算重连延迟
    let delay = wsConfig.reconnect.delay
    if (wsConfig.reconnect.exponentialBackoff) {
      delay = Math.min(delay * Math.pow(2, connectionState.reconnectAttempts - 1), wsConfig.reconnect.maxDelay)
    }

    addMessageLog('system', `${delay}ms后进行第${connectionState.reconnectAttempts}次重连...`)

    reconnectTimer = window.setTimeout(async () => {
      try {
        await connect()
        connectionState.isReconnecting = false
      } catch (error: any) {
        // 重连失败，继续尝试
        if (connectionState.reconnectAttempts < wsConfig.reconnect.maxAttempts) {
          scheduleReconnect()
        } else {
          connectionState.isReconnecting = false
          connectionState.status = 'error'
          addMessageLog('system', '重连失败，已达到最大重连次数')
        }
      }
    }, delay)
  }

  /**
   * 停止重连
   */
  const stopReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    connectionState.isReconnecting = false
  }

  /**
   * 添加消息日志
   */
  const addMessageLog = (type: MessageLog['type'], content: any, raw?: any) => {
    if (!enableMessageLog) return

    const log: MessageLog = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: Date.now(),
      size: calculateMessageSize(content),
      formatted: formatMessage(content)
    }

    if (raw) {
      ;(log as any).raw = raw
    }

    messageLogs.value.unshift(log)

    // 限制日志数量
    if (messageLogs.value.length > maxLogMessages) {
      messageLogs.value = messageLogs.value.slice(0, maxLogMessages)
    }
  }

  /**
   * 格式化消息内容
   */
  const formatMessage = (content: any): string => {
    if (typeof content === 'string') {
      try {
        // 尝试格式化JSON
        const parsed = JSON.parse(content)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return content
      }
    }
    return JSON.stringify(content, null, 2)
  }

  /**
   * 计算消息大小
   */
  const calculateMessageSize = (content: any): number => {
    if (typeof content === 'string') {
      return new Blob([content]).size
    }
    return new Blob([JSON.stringify(content)]).size
  }

  /**
   * 更新消息统计
   */
  const updateMessageStats = (message: any) => {
    const size = calculateMessageSize(message)
    const totalSize = messageStats.avgMessageSize * (messageStats.receivedCount + messageStats.sentCount - 1) + size
    const totalCount = messageStats.receivedCount + messageStats.sentCount

    messageStats.avgMessageSize = totalCount > 0 ? Math.round(totalSize / totalCount) : size
  }

  /**
   * 验证WebSocket配置
   */
  const validateConfig = (): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    // URL验证
    if (!wsConfig.url) {
      errors.push(t('dataSource.websocket.validation.urlRequired'))
    } else if (!isUrlValid.value) {
      errors.push(t('dataSource.websocket.validation.urlInvalid'))
    }

    // 协议验证
    const protocolKeys = wsConfig.protocols.filter(p => p.enabled && p.key).map(p => p.key)
    const duplicateProtocols = protocolKeys.filter((key, index) => protocolKeys.indexOf(key) !== index)
    if (duplicateProtocols.length > 0) {
      warnings.push(t('dataSource.websocket.validation.duplicateProtocols', { keys: duplicateProtocols.join(', ') }))
    }

    // 请求头验证
    const headerKeys = wsConfig.headers.filter(h => h.enabled && h.key).map(h => h.key)
    const duplicateHeaders = headerKeys.filter((key, index) => headerKeys.indexOf(key) !== index)
    if (duplicateHeaders.length > 0) {
      warnings.push(t('dataSource.websocket.validation.duplicateHeaders', { keys: duplicateHeaders.join(', ') }))
    }

    // 心跳配置验证
    if (wsConfig.heartbeat.enabled) {
      if (wsConfig.heartbeat.interval < 1000) {
        warnings.push(t('dataSource.websocket.validation.heartbeatIntervalTooSmall'))
      }

      if (wsConfig.heartbeat.messageType === 'json' && wsConfig.heartbeat.jsonMessage) {
        try {
          JSON.parse(wsConfig.heartbeat.jsonMessage)
        } catch (error: any) {
          errors.push(t('dataSource.websocket.validation.heartbeatJsonInvalid', { error: error.message }))
        }
      }
    }

    // 重连配置验证
    if (wsConfig.reconnect.enabled) {
      if (wsConfig.reconnect.maxAttempts < 1) {
        warnings.push(t('dataSource.websocket.validation.maxAttemptsInvalid'))
      }

      if (wsConfig.reconnect.delay < 100) {
        warnings.push(t('dataSource.websocket.validation.delayTooSmall'))
      }

      if (wsConfig.reconnect.maxDelay < wsConfig.reconnect.delay) {
        warnings.push(t('dataSource.websocket.validation.maxDelayInvalid'))
      }
    }

    // 构建验证结果
    const result: ValidationResult = {
      type: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success',
      text: errors.length > 0 ? t('common.invalid') : warnings.length > 0 ? t('common.warning') : t('common.valid'),
      detail:
        errors.length > 0
          ? errors.join('; ')
          : warnings.length > 0
            ? warnings.join('; ')
            : t('dataSource.websocket.validation.configValid')
    }

    validation.value = result
    return result
  }

  /**
   * 触发验证（防抖）
   */
  const triggerValidation = () => {
    if (!autoValidate) return

    if (validationTimer) {
      clearTimeout(validationTimer)
    }

    validationTimer = window.setTimeout(() => {
      validateConfig()
    }, validationDelay)
  }

  /**
   * 添加协议
   */
  const addProtocol = (key: string = '', value: string = '', enabled: boolean = true) => {
    wsConfig.protocols.push({ key, value, enabled })
    triggerValidation()
  }

  /**
   * 更新协议
   */
  const updateProtocol = (index: number, updates: Partial<KeyValuePair>) => {
    if (index >= 0 && index < wsConfig.protocols.length) {
      Object.assign(wsConfig.protocols[index], updates)
      triggerValidation()
    }
  }

  /**
   * 删除协议
   */
  const removeProtocol = (index: number) => {
    if (index >= 0 && index < wsConfig.protocols.length) {
      wsConfig.protocols.splice(index, 1)
      triggerValidation()
    }
  }

  /**
   * 添加请求头
   */
  const addHeader = (key: string = '', value: string = '', enabled: boolean = true) => {
    wsConfig.headers.push({ key, value, enabled })
    triggerValidation()
  }

  /**
   * 更新请求头
   */
  const updateHeader = (index: number, updates: Partial<KeyValuePair>) => {
    if (index >= 0 && index < wsConfig.headers.length) {
      Object.assign(wsConfig.headers[index], updates)
      triggerValidation()
    }
  }

  /**
   * 删除请求头
   */
  const removeHeader = (index: number) => {
    if (index >= 0 && index < wsConfig.headers.length) {
      wsConfig.headers.splice(index, 1)
      triggerValidation()
    }
  }

  /**
   * 更新心跳配置
   */
  const updateHeartbeatConfig = (config: Partial<typeof wsConfig.heartbeat>) => {
    Object.assign(wsConfig.heartbeat, config)

    // 如果心跳配置改变且正在连接，重新启动心跳
    if (isConnected.value) {
      if (wsConfig.heartbeat.enabled) {
        startHeartbeat()
      } else {
        stopHeartbeat()
      }
    }

    triggerValidation()
  }

  /**
   * 更新重连配置
   */
  const updateReconnectConfig = (config: Partial<typeof wsConfig.reconnect>) => {
    Object.assign(wsConfig.reconnect, config)
    triggerValidation()
  }

  /**
   * 清空消息日志
   */
  const clearMessageLogs = () => {
    messageLogs.value = []

    // 重置消息统计
    messageStats.sentCount = 0
    messageStats.receivedCount = 0
    messageStats.heartbeatCount = 0
    messageStats.lastMessageTime = undefined
    messageStats.avgMessageSize = 0
  }

  /**
   * 重置配置
   */
  const reset = () => {
    // 断开连接
    disconnect()

    // 重置配置
    Object.assign(wsConfig, {
      url: '',
      protocols: [],
      headers: [],
      heartbeat: {
        enabled: true,
        interval: 30000,
        messageType: 'ping',
        customMessage: '',
        jsonMessage: ''
      },
      reconnect: {
        enabled: true,
        maxAttempts: 5,
        delay: 1000,
        exponentialBackoff: true,
        maxDelay: 30000
      },
      connectionTimeout: 10000,
      bufferSize: 1000,
      binaryType: 'arraybuffer',
      compression: false
    })

    // 重置状态
    connectionState.status = 'disconnected'
    connectionState.instance = null
    connectionState.connectTime = undefined
    connectionState.lastActivity = undefined
    connectionState.reconnectAttempts = 0
    connectionState.isReconnecting = false
    connectionState.error = undefined

    // 清空日志和统计
    clearMessageLogs()
    validation.value = null

    // 清除定时器
    if (validationTimer) {
      clearTimeout(validationTimer)
      validationTimer = null
    }
  }

  /**
   * 获取配置副本
   */
  const getConfig = (): WebSocketConfigData => {
    return JSON.parse(JSON.stringify(wsConfig))
  }

  /**
   * 设置完整配置
   */
  const setConfig = (config: WebSocketConfigData) => {
    // 先断开连接
    if (isConnected.value) {
      disconnect()
    }

    Object.assign(wsConfig, config)
    triggerValidation()
  }

  /**
   * 获取连接状态信息
   */
  const getConnectionInfo = () => {
    return {
      status: connectionState.status,
      connected: isConnected.value,
      connectTime: connectionState.connectTime,
      duration: connectionDuration.value,
      reconnectAttempts: connectionState.reconnectAttempts,
      lastActivity: connectionState.lastActivity,
      error: connectionState.error,
      messageStats: { ...messageStats }
    }
  }

  /**
   * 获取消息日志
   */
  const getMessageLogs = (limit?: number): MessageLog[] => {
    if (limit && limit > 0) {
      return messageLogs.value.slice(0, limit)
    }
    return [...messageLogs.value]
  }

  // 监听配置变化
  watch(
    wsConfig,
    () => {
      // 可以在这里添加额外的变化处理逻辑
    },
    { deep: true }
  )

  // 组件卸载时清理
  onUnmounted(() => {
    disconnect()
  })

  // 初始验证
  if (autoValidate) {
    triggerValidation()
  }

  // 返回composable接口
  return {
    // 状态
    wsConfig,
    connectionState,
    messageStats,
    messageLogs,
    validation,

    // 计算属性
    isUrlValid,
    isConnected,
    isConnecting,
    hasValidConfig,
    enabledProtocols,
    enabledHeaders,
    connectionDuration,
    connectionSummary,

    // 连接管理
    connect,
    disconnect,
    sendMessage,

    // 心跳管理
    startHeartbeat,
    stopHeartbeat,
    updateHeartbeatConfig,
    getHeartbeatMessage,

    // 重连管理
    scheduleReconnect,
    stopReconnect,
    updateReconnectConfig,

    // 协议管理
    addProtocol,
    updateProtocol,
    removeProtocol,

    // 请求头管理
    addHeader,
    updateHeader,
    removeHeader,

    // 消息管理
    addMessageLog,
    clearMessageLogs,
    getMessageLogs,

    // 配置操作
    getConfig,
    setConfig,
    reset,

    // 验证
    validateConfig,
    triggerValidation,

    // 工具方法
    getConnectionInfo,
    formatMessage,
    calculateMessageSize
  }
}
