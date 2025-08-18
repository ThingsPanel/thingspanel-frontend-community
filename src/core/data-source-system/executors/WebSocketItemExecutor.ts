/**
 * WebSocket数据项执行器
 * 处理WebSocket长连接，支持自动重连、心跳保活、消息处理等
 */

import { DataItemExecutor } from './DataItemExecutor'
import type { WebSocketExecutorConfig, ExecutorConfig, DataItemType, ExecutorState, EXECUTOR_CONSTANTS } from './types'

/**
 * WebSocket连接状态
 */
enum WebSocketConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

/**
 * WebSocket消息类型
 */
interface WebSocketMessage {
  data: any
  timestamp: number
  type: string
  raw: MessageEvent
}

/**
 * WebSocket统计信息
 */
interface WebSocketStats {
  totalConnections: number
  successfulConnections: number
  failedConnections: number
  totalMessages: number
  reconnectAttempts: number
  currentReconnectAttempt: number
  connectionUptime: number
  lastConnectionTime?: number
  lastMessageTime?: number
  lastDisconnectionTime?: number
  averageMessageInterval: number
}

/**
 * WebSocket数据项执行器
 * 负责维护WebSocket长连接，处理实时数据流
 */
export class WebSocketItemExecutor extends DataItemExecutor {
  readonly type: DataItemType = 'websocket'

  /** WebSocket执行器专用配置 */
  private wsConfig: WebSocketExecutorConfig

  /** WebSocket连接实例 */
  private websocket?: WebSocket

  /** 连接状态 */
  private connectionState: WebSocketConnectionState = WebSocketConnectionState.DISCONNECTED

  /** 重连定时器 */
  private reconnectTimer?: number

  /** 心跳定时器 */
  private heartbeatTimer?: number

  /** 统计信息 */
  private stats: WebSocketStats = {
    totalConnections: 0,
    successfulConnections: 0,
    failedConnections: 0,
    totalMessages: 0,
    reconnectAttempts: 0,
    currentReconnectAttempt: 0,
    connectionUptime: 0,
    averageMessageInterval: 0
  }

  /** 消息历史记录（最近50条） */
  private messageHistory: WebSocketMessage[] = []

  /** 最后一条消息 */
  private lastMessage?: WebSocketMessage

  /** 消息时间间隔历史（用于计算平均间隔） */
  private messageIntervalHistory: number[] = []

  /** 连接开始时间 */
  private connectionStartTime?: number

  /** 是否手动关闭 */
  private isManualClose = false

  constructor(config: WebSocketExecutorConfig, callbacks?: any) {
    super(config, callbacks)
    this.wsConfig = config
  }

  // ========== 抽象方法实现 ==========

  /**
   * 验证WebSocket执行器配置
   */
  protected validateConfig(config: ExecutorConfig): boolean {
    if (config.type !== 'websocket') {
      console.error(`❌ [WebSocketItemExecutor] 配置类型错误: ${config.type}, 期望: websocket`)
      return false
    }

    const wsConfig = config as WebSocketExecutorConfig

    // 检查必要字段
    if (!wsConfig.url || !wsConfig.url.trim()) {
      console.error(`❌ [WebSocketItemExecutor] 缺少URL配置`)
      return false
    }

    // 验证WebSocket URL格式
    try {
      const url = new URL(wsConfig.url)
      if (!['ws:', 'wss:'].includes(url.protocol)) {
        console.error(`❌ [WebSocketItemExecutor] URL必须使用ws://或wss://协议`)
        return false
      }
    } catch (error) {
      console.error(`❌ [WebSocketItemExecutor] URL格式无效: ${wsConfig.url}`)
      return false
    }

    // 验证重连配置
    if (wsConfig.reconnectInterval && wsConfig.reconnectInterval <= 0) {
      console.error(`❌ [WebSocketItemExecutor] 重连间隔必须大于0`)
      return false
    }

    if (wsConfig.maxReconnectAttempts && wsConfig.maxReconnectAttempts < 0) {
      console.error(`❌ [WebSocketItemExecutor] 最大重连次数不能为负数`)
      return false
    }

    return true
  }

  /**
   * 执行WebSocket连接和数据获取
   * 注意：WebSocket是长连接，这个方法主要用于获取当前状态或最新消息
   */
  protected async executeInternal(): Promise<any> {
    console.log(`🔌 [WebSocketItemExecutor] 执行WebSocket数据获取: ${this.getId()}`)

    // 如果未连接，尝试连接
    if (this.connectionState === WebSocketConnectionState.DISCONNECTED) {
      await this.connect()
    }

    // 返回连接状态和最新消息
    return {
      connectionState: this.connectionState,
      isConnected: this.connectionState === WebSocketConnectionState.CONNECTED,
      lastMessage: this.lastMessage?.data,
      lastMessageTime: this.lastMessage?.timestamp,
      stats: this.getConnectionStats(),
      metadata: {
        url: this.wsConfig.url,
        protocols: this.wsConfig.protocols,
        uptime: this.getConnectionUptime()
      }
    }
  }

  // ========== WebSocket连接管理 ==========

  /**
   * 建立WebSocket连接
   */
  async connect(): Promise<void> {
    if (this.connectionState === WebSocketConnectionState.CONNECTING) {
      console.warn(`⚠️ [WebSocketItemExecutor] 连接正在进行中: ${this.getId()}`)
      return
    }

    this.isManualClose = false
    this.setConnectionState(WebSocketConnectionState.CONNECTING)

    try {
      console.log(`🔌 [WebSocketItemExecutor] 开始连接WebSocket: ${this.getId()} - ${this.wsConfig.url}`)

      // 创建WebSocket连接
      this.websocket = new WebSocket(this.wsConfig.url, this.wsConfig.protocols)

      // 设置事件监听器
      this.setupWebSocketEventListeners()

      // 等待连接建立或失败
      await this.waitForConnection()
    } catch (error) {
      this.handleConnectionError(error as Error)
      throw error
    }
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    this.isManualClose = true
    this.clearTimers()

    if (this.websocket) {
      console.log(`🔌 [WebSocketItemExecutor] 断开WebSocket连接: ${this.getId()}`)
      this.websocket.close(1000, 'Manual disconnect')
      this.websocket = undefined
    }

    this.setConnectionState(WebSocketConnectionState.DISCONNECTED)
  }

  /**
   * 发送消息
   */
  sendMessage(message: string | object): void {
    if (this.connectionState !== WebSocketConnectionState.CONNECTED || !this.websocket) {
      throw new Error('WebSocket未连接')
    }

    const messageToSend = typeof message === 'string' ? message : JSON.stringify(message)

    try {
      this.websocket.send(messageToSend)
      console.log(`📤 [WebSocketItemExecutor] 发送消息: ${this.getId()}`, messageToSend.substring(0, 100))
    } catch (error) {
      console.error(`❌ [WebSocketItemExecutor] 发送消息失败: ${this.getId()}`, error)
      throw error
    }
  }

  // ========== 私有方法 ==========

  /**
   * 设置WebSocket事件监听器
   */
  private setupWebSocketEventListeners(): void {
    if (!this.websocket) return

    this.websocket.onopen = this.handleWebSocketOpen.bind(this)
    this.websocket.onmessage = this.handleWebSocketMessage.bind(this)
    this.websocket.onerror = this.handleWebSocketError.bind(this)
    this.websocket.onclose = this.handleWebSocketClose.bind(this)
  }

  /**
   * 处理WebSocket连接打开
   */
  private handleWebSocketOpen(event: Event): void {
    this.connectionStartTime = Date.now()
    this.stats.successfulConnections++
    this.stats.totalConnections++
    this.stats.lastConnectionTime = this.connectionStartTime
    this.stats.currentReconnectAttempt = 0

    this.setConnectionState(WebSocketConnectionState.CONNECTED)
    this.setState(ExecutorState.SUCCESS)

    // 启动心跳
    this.startHeartbeat()

    console.log(`✅ [WebSocketItemExecutor] WebSocket连接已建立: ${this.getId()}`)
    this.emit('websocket-connected' as any, { url: this.wsConfig.url })
  }

  /**
   * 处理WebSocket消息
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    const now = Date.now()

    try {
      // 解析消息数据
      let messageData: any
      try {
        messageData = JSON.parse(event.data)
      } catch {
        messageData = event.data
      }

      // 创建消息对象
      const message: WebSocketMessage = {
        data: messageData,
        timestamp: now,
        type: typeof messageData,
        raw: event
      }

      // 更新统计信息
      this.updateMessageStats(message)

      // 保存到历史记录
      this.addToMessageHistory(message)

      // 更新最后一条消息
      this.lastMessage = message

      console.log(
        `📨 [WebSocketItemExecutor] 收到WebSocket消息: ${this.getId()}`,
        typeof messageData === 'object'
          ? JSON.stringify(messageData).substring(0, 100)
          : String(messageData).substring(0, 100)
      )

      // 触发数据更新事件
      this.emit('data-updated' as any, messageData)
    } catch (error) {
      console.error(`❌ [WebSocketItemExecutor] 处理WebSocket消息失败: ${this.getId()}`, error)
    }
  }

  /**
   * 处理WebSocket错误
   */
  private handleWebSocketError(event: Event): void {
    console.error(`❌ [WebSocketItemExecutor] WebSocket错误: ${this.getId()}`, event)
    this.setState(ExecutorState.ERROR)
    this.emit('websocket-error' as any, { event, url: this.wsConfig.url })
  }

  /**
   * 处理WebSocket连接关闭
   */
  private handleWebSocketClose(event: CloseEvent): void {
    this.stats.lastDisconnectionTime = Date.now()

    if (this.connectionStartTime) {
      this.stats.connectionUptime += Date.now() - this.connectionStartTime
      this.connectionStartTime = undefined
    }

    this.clearTimers()

    console.log(
      `🔌 [WebSocketItemExecutor] WebSocket连接已关闭: ${this.getId()} - Code: ${event.code}, Reason: ${event.reason}`
    )

    if (!this.isManualClose && event.code !== 1000) {
      // 非正常关闭，尝试重连
      this.scheduleReconnect()
    } else {
      this.setConnectionState(WebSocketConnectionState.DISCONNECTED)
    }

    this.emit('websocket-disconnected' as any, {
      code: event.code,
      reason: event.reason,
      url: this.wsConfig.url
    })
  }

  /**
   * 等待连接建立
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.websocket) {
        reject(new Error('WebSocket实例不存在'))
        return
      }

      const timeout = this.wsConfig.timeout || EXECUTOR_CONSTANTS.DEFAULT_TIMEOUT
      const timeoutId = setTimeout(() => {
        reject(new Error(`WebSocket连接超时 (${timeout}ms)`))
      }, timeout)

      const onOpen = () => {
        clearTimeout(timeoutId)
        resolve()
      }

      const onError = () => {
        clearTimeout(timeoutId)
        reject(new Error('WebSocket连接失败'))
      }

      this.websocket.addEventListener('open', onOpen, { once: true })
      this.websocket.addEventListener('error', onError, { once: true })
    })
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    const maxAttempts = this.wsConfig.maxReconnectAttempts || 5

    if (this.stats.currentReconnectAttempt >= maxAttempts) {
      console.error(`❌ [WebSocketItemExecutor] 重连次数已达上限: ${this.getId()} (${maxAttempts}次)`)
      this.setConnectionState(WebSocketConnectionState.FAILED)
      this.setState(ExecutorState.ERROR)
      return
    }

    this.stats.currentReconnectAttempt++
    this.stats.reconnectAttempts++

    const reconnectInterval = this.wsConfig.reconnectInterval || 5000
    const delay = Math.min(reconnectInterval * Math.pow(2, this.stats.currentReconnectAttempt - 1), 30000) // 指数退避，最大30秒

    console.log(
      `🔄 [WebSocketItemExecutor] ${delay}ms后尝试重连: ${this.getId()} (第${this.stats.currentReconnectAttempt}次)`
    )

    this.setConnectionState(WebSocketConnectionState.RECONNECTING)

    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(error => {
        console.error(`❌ [WebSocketItemExecutor] 重连失败: ${this.getId()}`, error)
        this.scheduleReconnect()
      })
    }, delay)
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    const heartbeatInterval = this.wsConfig.heartbeatInterval || EXECUTOR_CONSTANTS.DEFAULT_HEARTBEAT_INTERVAL

    this.heartbeatTimer = window.setInterval(() => {
      if (this.connectionState === WebSocketConnectionState.CONNECTED && this.websocket) {
        try {
          this.websocket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
        } catch (error) {
          console.error(`❌ [WebSocketItemExecutor] 心跳发送失败: ${this.getId()}`, error)
        }
      }
    }, heartbeatInterval)
  }

  /**
   * 清理定时器
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }

    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }

  /**
   * 设置连接状态
   */
  private setConnectionState(state: WebSocketConnectionState): void {
    if (this.connectionState !== state) {
      const oldState = this.connectionState
      this.connectionState = state

      console.log(`🔌 [WebSocketItemExecutor] 连接状态变更: ${this.getId()} ${oldState} -> ${state}`)
      this.emit('connection-state-changed' as any, { oldState, newState: state })
    }
  }

  /**
   * 处理连接错误
   */
  private handleConnectionError(error: Error): void {
    this.stats.failedConnections++
    this.stats.totalConnections++
    this.setConnectionState(WebSocketConnectionState.FAILED)
    this.setState(ExecutorState.ERROR)

    console.error(`❌ [WebSocketItemExecutor] 连接错误: ${this.getId()}`, error)
  }

  /**
   * 更新消息统计
   */
  private updateMessageStats(message: WebSocketMessage): void {
    this.stats.totalMessages++
    this.stats.lastMessageTime = message.timestamp

    // 计算消息间隔
    if (this.lastMessage) {
      const interval = message.timestamp - this.lastMessage.timestamp
      this.messageIntervalHistory.unshift(interval)

      // 保留最近20次间隔记录
      if (this.messageIntervalHistory.length > 20) {
        this.messageIntervalHistory = this.messageIntervalHistory.slice(0, 20)
      }

      // 计算平均消息间隔
      this.stats.averageMessageInterval =
        this.messageIntervalHistory.reduce((sum, interval) => sum + interval, 0) / this.messageIntervalHistory.length
    }
  }

  /**
   * 添加到消息历史
   */
  private addToMessageHistory(message: WebSocketMessage): void {
    this.messageHistory.unshift(message)

    // 保留最近50条消息
    if (this.messageHistory.length > 50) {
      this.messageHistory = this.messageHistory.slice(0, 50)
    }
  }

  // ========== 公共接口方法 ==========

  /**
   * 获取连接状态
   */
  getConnectionState(): WebSocketConnectionState {
    return this.connectionState
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.connectionState === WebSocketConnectionState.CONNECTED
  }

  /**
   * 获取连接统计信息
   */
  getConnectionStats(): Readonly<WebSocketStats> {
    const stats = { ...this.stats }

    // 更新当前连接时长
    if (this.connectionStartTime) {
      stats.connectionUptime = this.stats.connectionUptime + (Date.now() - this.connectionStartTime)
    }

    return stats
  }

  /**
   * 获取消息历史
   */
  getMessageHistory(): Readonly<WebSocketMessage[]> {
    return [...this.messageHistory]
  }

  /**
   * 获取最新消息
   */
  getLastMessage(): Readonly<WebSocketMessage> | undefined {
    return this.lastMessage ? { ...this.lastMessage } : undefined
  }

  /**
   * 获取连接时长
   */
  getConnectionUptime(): number {
    if (this.connectionStartTime) {
      return this.stats.connectionUptime + (Date.now() - this.connectionStartTime)
    }
    return this.stats.connectionUptime
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      totalMessages: 0,
      reconnectAttempts: 0,
      currentReconnectAttempt: 0,
      connectionUptime: 0,
      averageMessageInterval: 0
    }
    this.messageHistory = []
    this.messageIntervalHistory = []
    this.lastMessage = undefined
  }

  /**
   * 更新WebSocket配置
   */
  updateWebSocketConfig(config: Partial<WebSocketExecutorConfig>): void {
    const updatedConfig = { ...this.wsConfig, ...config }

    if (!this.validateConfig(updatedConfig as ExecutorConfig)) {
      throw new Error('WebSocket配置验证失败')
    }

    // 如果URL发生变化，需要重新连接
    const urlChanged = updatedConfig.url !== this.wsConfig.url

    this.wsConfig = updatedConfig as WebSocketExecutorConfig
    this.updateConfig(updatedConfig)

    if (urlChanged && this.isConnected()) {
      console.log(`🔄 [WebSocketItemExecutor] URL已变更，重新连接: ${this.getId()}`)
      this.disconnect()
      setTimeout(() => {
        this.connect().catch(error => {
          console.error(`❌ [WebSocketItemExecutor] 重连失败: ${this.getId()}`, error)
        })
      }, 1000)
    }
  }

  /**
   * 获取WebSocket配置
   */
  getWebSocketConfig(): Readonly<WebSocketExecutorConfig> {
    return { ...this.wsConfig }
  }

  // ========== 生命周期重写 ==========

  /**
   * WebSocket执行器初始化
   */
  protected async performInitialization(): Promise<void> {
    console.log(`🔌 [WebSocketItemExecutor] 初始化WebSocket执行器: ${this.getId()}`)
    // WebSocket初始化时不自动连接，等待启动时连接
  }

  /**
   * 启动时建立连接
   */
  async start(trigger?: any): Promise<void> {
    await super.start(trigger)

    // 启动时自动连接
    if (!this.isConnected()) {
      try {
        await this.connect()
      } catch (error) {
        console.error(`❌ [WebSocketItemExecutor] 启动时连接失败: ${this.getId()}`, error)
        // 不抛出错误，允许后续重连
      }
    }
  }

  /**
   * 停止时断开连接
   */
  stop(): void {
    this.disconnect()
    super.stop()
  }

  /**
   * 销毁时清理资源
   */
  dispose(): void {
    this.disconnect()
    super.dispose()
  }
}
