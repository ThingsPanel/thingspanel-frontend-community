<template>
  <div class="websocket-data-input-test">
    <n-card title="WebSocket数据输入组件测试" :bordered="false">
      <n-space vertical :size="24">
        <!-- 基础用法示例 -->
        <n-card title="WebSocket连接配置" size="small" :bordered="true">
          <WebSocketDataInput
            v-model="wsConfigData"
            @test-result="handleTestResult"
            @validation-change="handleValidationChange"
            @change="handleConfigChange"
            @message="handleMessage"
          />
        </n-card>

        <!-- 配置数据显示 -->
        <n-card title="当前配置数据" size="small" :bordered="true">
          <JsonDataInput v-model="configDisplayData" :show-label="false" :readonly="true" :rows="10" />
        </n-card>

        <!-- 连接状态和消息 -->
        <n-card title="连接状态与消息" size="small" :bordered="true">
          <n-space vertical :size="16">
            <!-- 连接控制 -->
            <n-space>
              <n-button type="primary" :loading="connecting" :disabled="!wsConfigData.url" @click="connectWebSocket">
                {{ connected ? '断开连接' : '连接WebSocket' }}
              </n-button>
              <n-button :disabled="!connected" @click="sendTestMessage">发送测试消息</n-button>
              <n-button @click="clearConnectionLog">清空日志</n-button>
            </n-space>

            <!-- 连接状态显示 -->
            <div v-if="connectionInfo.status" class="connection-info">
              <n-space align="center">
                <n-tag :type="getConnectionTagType(connectionInfo.status)" size="small">
                  {{ getConnectionStatusText(connectionInfo.status) }}
                </n-tag>
                <n-text depth="3" class="text-sm">连接时间: {{ connectionInfo.duration }}</n-text>
                <n-text depth="3" class="text-sm">消息数: {{ connectionInfo.messageCount }}</n-text>
              </n-space>
            </div>

            <!-- 实时消息日志 -->
            <div class="message-log">
              <n-card title="实时消息" size="small" :bordered="true">
                <div class="log-content">
                  <div v-for="(log, index) in connectionLogs" :key="index" class="log-entry">
                    <n-tag size="tiny" :type="log.type">{{ log.timestamp }}</n-tag>
                    <span class="log-message">{{ log.message }}</span>
                  </div>
                  <div v-if="connectionLogs.length === 0" class="no-logs">
                    <n-text depth="3">暂无连接日志</n-text>
                  </div>
                </div>
              </n-card>
            </div>
          </n-space>
        </n-card>

        <!-- 控制面板 -->
        <n-card title="组件控制" size="small" :bordered="true">
          <n-space>
            <n-button @click="loadSampleConfig">加载示例配置</n-button>
            <n-button type="warning" @click="clearConfig">清空配置</n-button>
            <n-button type="primary" @click="validateConfig">验证配置</n-button>
            <n-button @click="exportConfig">导出配置</n-button>
          </n-space>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * WebSocket数据输入组件测试页面
 * 演示WebSocketDataInput组件的各种功能和WebSocket连接测试
 */

import { ref, reactive, computed, onUnmounted } from 'vue'
import type { TagType } from 'naive-ui'
import WebSocketDataInput from '@/core/data-source-system/components/data-source-config-form/components/WebSocketDataInput.vue'
import JsonDataInput from '@/core/data-source-system/components/data-source-config-form/components/JsonDataInput.vue'
import type {
  WebSocketConfigData,
  TestConnectionResponse,
  ValidationResult
} from '@/core/data-source-system/components/data-source-config-form/types'

// 响应式数据
const wsConfigData = ref<WebSocketConfigData>({
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

// 配置显示数据
const configDisplayData = computed({
  get: () => JSON.stringify(wsConfigData.value, null, 2),
  set: () => {} // 只读
})

// 连接状态
const connecting = ref(false)
const connected = ref(false)
const connectionInfo = reactive<{
  status?: 'connecting' | 'connected' | 'disconnected' | 'error'
  duration: string
  messageCount: number
  startTime?: number
}>({
  duration: '-',
  messageCount: 0
})

// 连接日志
const connectionLogs = ref<
  Array<{
    timestamp: string
    message: string
    type: TagType
  }>
>([])

// WebSocket实例
let testWebSocket: WebSocket | null = null

/**
 * 添加连接日志
 */
const addConnectionLog = (message: string, type: TagType = 'info') => {
  connectionLogs.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    message,
    type
  })

  // 限制日志数量
  if (connectionLogs.value.length > 20) {
    connectionLogs.value = connectionLogs.value.slice(0, 20)
  }
}

/**
 * 获取连接状态标签类型
 */
const getConnectionTagType = (status: string): TagType => {
  switch (status) {
    case 'connected':
      return 'success'
    case 'connecting':
      return 'info'
    case 'disconnected':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'default'
  }
}

/**
 * 获取连接状态文本
 */
const getConnectionStatusText = (status: string): string => {
  switch (status) {
    case 'connected':
      return '已连接'
    case 'connecting':
      return '连接中'
    case 'disconnected':
      return '已断开'
    case 'error':
      return '连接错误'
    default:
      return '未知状态'
  }
}

/**
 * 连接WebSocket
 */
const connectWebSocket = async () => {
  if (connected.value) {
    // 断开连接
    if (testWebSocket) {
      testWebSocket.close()
      testWebSocket = null
    }
    return
  }

  if (!wsConfigData.value.url) {
    window.$message?.warning('请先配置WebSocket URL')
    return
  }

  connecting.value = true
  connectionInfo.status = 'connecting'
  connectionInfo.startTime = Date.now()
  addConnectionLog('开始连接WebSocket...', 'info')

  try {
    testWebSocket = new WebSocket(wsConfigData.value.url)

    testWebSocket.onopen = () => {
      connected.value = true
      connecting.value = false
      connectionInfo.status = 'connected'
      addConnectionLog('WebSocket连接成功', 'success')
      window.$message?.success('WebSocket连接成功')
    }

    testWebSocket.onmessage = event => {
      connectionInfo.messageCount++
      addConnectionLog(`收到消息: ${event.data}`, 'info')
    }

    testWebSocket.onclose = event => {
      connected.value = false
      connecting.value = false
      connectionInfo.status = 'disconnected'
      addConnectionLog(`连接已关闭: ${event.code} ${event.reason}`, 'warning')
    }

    testWebSocket.onerror = () => {
      connected.value = false
      connecting.value = false
      connectionInfo.status = 'error'
      addConnectionLog('连接发生错误', 'error')
      window.$message?.error('WebSocket连接失败')
    }

    // 连接超时处理
    setTimeout(() => {
      if (connecting.value) {
        testWebSocket?.close()
        connecting.value = false
        connectionInfo.status = 'error'
        addConnectionLog('连接超时', 'error')
        window.$message?.error('连接超时')
      }
    }, wsConfigData.value.connectionTimeout)
  } catch (error: any) {
    connecting.value = false
    connectionInfo.status = 'error'
    addConnectionLog(`连接异常: ${error.message}`, 'error')
    window.$message?.error(`连接异常: ${error.message}`)
  }
}

/**
 * 发送测试消息
 */
const sendTestMessage = () => {
  if (!testWebSocket || testWebSocket.readyState !== WebSocket.OPEN) {
    window.$message?.warning('WebSocket未连接')
    return
  }

  const testMessage = {
    type: 'test',
    timestamp: new Date().toISOString(),
    message: 'Hello from ThingsPanel!'
  }

  const messageStr = JSON.stringify(testMessage)
  testWebSocket.send(messageStr)
  addConnectionLog(`发送测试消息: ${messageStr}`, 'success')
}

/**
 * 清空连接日志
 */
const clearConnectionLog = () => {
  connectionLogs.value = []
  connectionInfo.messageCount = 0
  addConnectionLog('日志已清空', 'info')
}

/**
 * 处理测试结果
 */
const handleTestResult = (result: TestConnectionResponse) => {
  const message = result.success
    ? `连接测试成功: ${result.statusText} (${result.responseTime}ms)`
    : `连接测试失败: ${result.error || '未知错误'}`
  addConnectionLog(message, result.success ? 'success' : 'error')
}

/**
 * 处理验证状态变化
 */
const handleValidationChange = (validation: ValidationResult) => {
  addConnectionLog(`验证状态: ${validation.text} - ${validation.detail}`, validation.type)
}

/**
 * 处理配置变化
 */
const handleConfigChange = (config: WebSocketConfigData) => {
  addConnectionLog(`WebSocket配置已更新: ${config.url || '(空URL)'}`, 'info')
}

/**
 * 处理消息接收
 */
const handleMessage = (message: any) => {
  addConnectionLog(`收到实时消息: ${JSON.stringify(message)}`, 'info')
}

/**
 * 加载示例配置
 */
const loadSampleConfig = () => {
  const sampleConfig: WebSocketConfigData = {
    url: 'wss://echo.websocket.org',
    protocols: [
      { key: 'chat', value: 'v1.0', enabled: true },
      { key: 'notification', value: 'v2.0', enabled: false }
    ],
    headers: [
      { key: 'Authorization', value: 'Bearer your_token_here', enabled: true },
      { key: 'Client-Version', value: 'ThingsPanel/1.0', enabled: true }
    ],
    heartbeat: {
      enabled: true,
      interval: 30000,
      messageType: 'json',
      customMessage: '',
      jsonMessage: JSON.stringify({ type: 'ping', timestamp: Date.now() }, null, 2)
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
  }

  wsConfigData.value = sampleConfig
  addConnectionLog('示例配置已加载', 'success')
  window.$message?.success('示例配置已加载')
}

/**
 * 清空配置
 */
const clearConfig = () => {
  // 先断开连接
  if (connected.value) {
    testWebSocket?.close()
  }

  wsConfigData.value = {
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
  }

  // 重置连接状态
  connected.value = false
  connecting.value = false
  connectionInfo.status = undefined
  connectionInfo.messageCount = 0
  connectionInfo.duration = '-'

  addConnectionLog('配置已清空', 'warning')
  window.$message?.info('配置已清空')
}

/**
 * 验证配置
 */
const validateConfig = () => {
  const config = wsConfigData.value
  const errors: string[] = []

  // 基础验证
  if (!config.url) {
    errors.push('WebSocket URL不能为空')
  } else {
    try {
      const url = new URL(config.url)
      if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
        errors.push('WebSocket URL协议必须是ws://或wss://')
      }
    } catch {
      errors.push('WebSocket URL格式无效')
    }
  }

  // 心跳配置验证
  if (config.heartbeat.enabled) {
    if (config.heartbeat.interval < 1000) {
      errors.push('心跳间隔不能小于1000ms')
    }

    if (config.heartbeat.messageType === 'json' && config.heartbeat.jsonMessage) {
      try {
        JSON.parse(config.heartbeat.jsonMessage)
      } catch {
        errors.push('心跳JSON消息格式无效')
      }
    }
  }

  // 重连配置验证
  if (config.reconnect.enabled) {
    if (config.reconnect.maxAttempts < 1) {
      errors.push('最大重连次数不能小于1')
    }
    if (config.reconnect.delay < 100) {
      errors.push('重连延迟不能小于100ms')
    }
  }

  // 显示验证结果
  if (errors.length === 0) {
    addConnectionLog('配置验证通过', 'success')
    window.$message?.success('配置验证通过')
  } else {
    const errorMessage = `配置验证失败: ${errors.join(', ')}`
    addConnectionLog(errorMessage, 'error')
    window.$message?.error(errorMessage)
  }
}

/**
 * 导出配置
 */
const exportConfig = () => {
  const configJson = JSON.stringify(wsConfigData.value, null, 2)

  // 创建下载链接
  const blob = new Blob([configJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `websocket-config-${new Date().toISOString().split('T')[0]}.json`
  link.click()

  URL.revokeObjectURL(url)
  addConnectionLog('配置已导出', 'success')
  window.$message?.success('配置已导出')
}

// 更新连接持续时间
setInterval(() => {
  if (connectionInfo.startTime && connected.value) {
    const duration = Date.now() - connectionInfo.startTime
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)

    if (minutes > 0) {
      connectionInfo.duration = `${minutes}m ${seconds % 60}s`
    } else {
      connectionInfo.duration = `${seconds}s`
    }
  }
}, 1000)

// 组件卸载时清理连接
onUnmounted(() => {
  if (testWebSocket) {
    testWebSocket.close()
  }
})

// 页面加载时添加欢迎日志
addConnectionLog('WebSocket数据输入组件测试页面已加载', 'info')
</script>

<style scoped>
/**
 * WebSocket数据输入组件测试页面样式
 */

.websocket-data-input-test {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 连接信息样式 */
.connection-info {
  padding: 12px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

/* 消息日志样式 */
.message-log {
  max-height: 400px;
}

.log-content {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  background: var(--card-color);
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--divider-color);
}

.log-entry:last-child {
  border-bottom: none;
}

.log-message {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-color);
  word-break: break-word;
}

.no-logs {
  text-align: center;
  padding: 20px;
}

/* 工具类 */
.text-sm {
  font-size: 0.875rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

/* 暗主题适配 */
[data-theme='dark'] .connection-info {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .log-content {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .websocket-data-input-test {
    padding: 8px;
  }

  .connection-info {
    padding: 8px;
  }

  .log-entry {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
