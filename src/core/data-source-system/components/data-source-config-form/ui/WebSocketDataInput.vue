<template>
  <div class="websocket-data-input">
    <!-- WebSocket配置表单 -->
    <n-form ref="formRef" :model="wsConfig" :rules="formRules" :show-require-mark="false" size="small">
      <!-- 基础连接配置 -->
      <n-card :title="$t('dataSource.websocket.basicConfig')" size="small" :bordered="true" class="mb-4">
        <n-space vertical :size="16">
          <!-- WebSocket URL配置 -->
          <n-form-item :label="$t('dataSource.websocket.url')" path="url" :show-require-mark="true">
            <n-input-group>
              <n-input
                v-model:value="wsConfig.url"
                :placeholder="$t('dataSource.websocket.urlPlaceholder')"
                clearable
                class="flex-1"
                @blur="validateUrl"
              />
              <n-button type="primary" :loading="testLoading" :disabled="!isUrlValid" @click="testConnection">
                {{ $t('dataSource.websocket.testConnection') }}
              </n-button>
            </n-input-group>
          </n-form-item>

          <!-- URL验证状态 -->
          <div v-if="urlValidation.message" class="url-validation">
            <n-alert :type="urlValidation.type" :title="urlValidation.message" size="small" :closable="false" />
          </div>

          <!-- 连接状态显示 -->
          <div v-if="connectionStatus.connected !== undefined" class="connection-status">
            <n-space align="center">
              <n-tag :type="connectionStatus.connected ? 'success' : 'error'" size="small">
                <n-icon class="mr-1">
                  <component :is="connectionStatus.connected ? ConnectedIcon : DisconnectedIcon" />
                </n-icon>
                {{
                  connectionStatus.connected
                    ? $t('dataSource.websocket.connected')
                    : $t('dataSource.websocket.disconnected')
                }}
              </n-tag>

              <n-text depth="3" class="text-sm">
                {{ $t('dataSource.websocket.lastConnectTime') }}: {{ connectionStatus.lastConnectTime }}
              </n-text>

              <n-text v-if="connectionStatus.connected" depth="3" class="text-sm">
                {{ $t('dataSource.websocket.duration') }}: {{ connectionDuration }}
              </n-text>
            </n-space>
          </div>
        </n-space>
      </n-card>

      <!-- 标签页配置 -->
      <n-tabs v-model:value="activeTab" type="line" animated size="small">
        <!-- 连接配置 -->
        <n-tab-pane name="connection" :tab="$t('dataSource.websocket.connectionConfig')">
          <div class="tab-content">
            <n-space vertical :size="16">
              <!-- 子协议配置 -->
              <n-form-item :label="$t('dataSource.websocket.protocols')">
                <KeyValueEditor
                  v-model="wsConfig.protocols"
                  :label="$t('dataSource.websocket.protocolsDescription')"
                  :placeholder-key="$t('dataSource.websocket.protocolKeyPlaceholder')"
                  :placeholder-value="$t('dataSource.websocket.protocolValuePlaceholder')"
                  :enable-toggle="true"
                  @change="handleProtocolsChange"
                />
              </n-form-item>

              <!-- 请求头配置 -->
              <n-form-item :label="$t('dataSource.websocket.headers')">
                <KeyValueEditor
                  v-model="wsConfig.headers"
                  :label="$t('dataSource.websocket.headersDescription')"
                  :placeholder-key="$t('dataSource.websocket.headerKeyPlaceholder')"
                  :placeholder-value="$t('dataSource.websocket.headerValuePlaceholder')"
                  :enable-toggle="true"
                  @change="handleHeadersChange"
                />
              </n-form-item>
            </n-space>
          </div>
        </n-tab-pane>

        <!-- 心跳配置 -->
        <n-tab-pane name="heartbeat" :tab="$t('dataSource.websocket.heartbeat')">
          <div class="tab-content">
            <n-space vertical :size="16">
              <!-- 启用心跳 -->
              <n-form-item :label="$t('dataSource.websocket.enableHeartbeat')">
                <n-switch
                  v-model:value="wsConfig.heartbeat.enabled"
                  :checked-value="true"
                  :unchecked-value="false"
                  @update:value="handleHeartbeatToggle"
                />
              </n-form-item>

              <!-- 心跳间隔 -->
              <n-form-item v-if="wsConfig.heartbeat.enabled" :label="$t('dataSource.websocket.heartbeatInterval')">
                <n-input-number
                  v-model:value="wsConfig.heartbeat.interval"
                  :min="1000"
                  :max="300000"
                  :step="1000"
                  :placeholder="$t('dataSource.websocket.heartbeatIntervalPlaceholder')"
                  class="w-full"
                >
                  <template #suffix>ms</template>
                </n-input-number>
              </n-form-item>

              <!-- 心跳消息 -->
              <n-form-item v-if="wsConfig.heartbeat.enabled" :label="$t('dataSource.websocket.heartbeatMessage')">
                <n-radio-group
                  v-model:value="wsConfig.heartbeat.messageType"
                  @update:value="handleHeartbeatMessageTypeChange"
                >
                  <n-space vertical>
                    <n-radio value="ping">{{ $t('dataSource.websocket.heartbeatTypes.ping') }}</n-radio>
                    <n-radio value="json">{{ $t('dataSource.websocket.heartbeatTypes.json') }}</n-radio>
                    <n-radio value="text">{{ $t('dataSource.websocket.heartbeatTypes.text') }}</n-radio>
                    <n-radio value="custom">{{ $t('dataSource.websocket.heartbeatTypes.custom') }}</n-radio>
                  </n-space>
                </n-radio-group>
              </n-form-item>

              <!-- 自定义心跳消息 -->
              <n-form-item
                v-if="wsConfig.heartbeat.enabled && wsConfig.heartbeat.messageType === 'custom'"
                :label="$t('dataSource.websocket.customHeartbeatMessage')"
              >
                <n-input
                  v-model:value="wsConfig.heartbeat.customMessage"
                  type="textarea"
                  :placeholder="$t('dataSource.websocket.customHeartbeatPlaceholder')"
                  :rows="3"
                  show-count
                />
              </n-form-item>

              <!-- JSON心跳消息 -->
              <n-form-item
                v-if="wsConfig.heartbeat.enabled && wsConfig.heartbeat.messageType === 'json'"
                :label="$t('dataSource.websocket.jsonHeartbeatMessage')"
              >
                <JsonDataInput
                  v-model="wsConfig.heartbeat.jsonMessage"
                  :show-label="false"
                  :placeholder="$t('dataSource.websocket.jsonHeartbeatPlaceholder')"
                  :rows="4"
                  :auto-validate="true"
                />
              </n-form-item>
            </n-space>
          </div>
        </n-tab-pane>

        <!-- 重连配置 -->
        <n-tab-pane name="reconnect" :tab="$t('dataSource.websocket.reconnect')">
          <div class="tab-content">
            <n-space vertical :size="16">
              <!-- 启用自动重连 -->
              <n-form-item :label="$t('dataSource.websocket.enableReconnect')">
                <n-switch v-model:value="wsConfig.reconnect.enabled" :checked-value="true" :unchecked-value="false" />
              </n-form-item>

              <!-- 重连配置 -->
              <div v-if="wsConfig.reconnect.enabled">
                <!-- 最大重连次数 -->
                <n-form-item :label="$t('dataSource.websocket.maxReconnectAttempts')">
                  <n-input-number
                    v-model:value="wsConfig.reconnect.maxAttempts"
                    :min="1"
                    :max="100"
                    :placeholder="$t('dataSource.websocket.maxReconnectAttemptsPlaceholder')"
                    class="w-full"
                  >
                    <template #suffix>{{ $t('dataSource.websocket.times') }}</template>
                  </n-input-number>
                </n-form-item>

                <!-- 重连延迟 -->
                <n-form-item :label="$t('dataSource.websocket.reconnectDelay')">
                  <n-input-number
                    v-model:value="wsConfig.reconnect.delay"
                    :min="100"
                    :max="60000"
                    :step="100"
                    :placeholder="$t('dataSource.websocket.reconnectDelayPlaceholder')"
                    class="w-full"
                  >
                    <template #suffix>ms</template>
                  </n-input-number>
                </n-form-item>

                <!-- 指数退避 -->
                <n-form-item :label="$t('dataSource.websocket.exponentialBackoff')">
                  <n-space align="center">
                    <n-switch
                      v-model:value="wsConfig.reconnect.exponentialBackoff"
                      :checked-value="true"
                      :unchecked-value="false"
                    />
                    <n-text depth="3" class="text-sm">
                      {{ $t('dataSource.websocket.exponentialBackoffDescription') }}
                    </n-text>
                  </n-space>
                </n-form-item>

                <!-- 最大延迟时间 -->
                <n-form-item v-if="wsConfig.reconnect.exponentialBackoff" :label="$t('dataSource.websocket.maxDelay')">
                  <n-input-number
                    v-model:value="wsConfig.reconnect.maxDelay"
                    :min="1000"
                    :max="300000"
                    :step="1000"
                    :placeholder="$t('dataSource.websocket.maxDelayPlaceholder')"
                    class="w-full"
                  >
                    <template #suffix>ms</template>
                  </n-input-number>
                </n-form-item>
              </div>
            </n-space>
          </div>
        </n-tab-pane>

        <!-- 消息预览 -->
        <n-tab-pane name="messages" :tab="$t('dataSource.websocket.messagePreview')" :disabled="!hasMessages">
          <div class="tab-content">
            <n-space vertical :size="12">
              <!-- 消息统计 -->
              <div class="message-stats">
                <n-space>
                  <n-statistic :label="$t('dataSource.websocket.totalMessages')" :value="messages.length" />
                  <n-statistic :label="$t('dataSource.websocket.connectionDuration')" :value="connectionDuration" />
                </n-space>
              </div>

              <!-- 消息列表 -->
              <n-card title="实时消息" size="small" :bordered="true">
                <div class="message-list">
                  <div v-for="(message, index) in recentMessages" :key="index" class="message-item">
                    <div class="message-header">
                      <n-tag size="tiny" :type="getMessageType(message.type)">
                        {{ message.type }}
                      </n-tag>
                      <n-text depth="3" class="text-xs">{{ message.timestamp }}</n-text>
                    </div>
                    <div class="message-content">
                      <n-code :code="message.content" language="json" :hljs="false" style="font-size: 11px" />
                    </div>
                  </div>
                </div>

                <n-empty
                  v-if="messages.length === 0"
                  :description="$t('dataSource.websocket.noMessages')"
                  size="small"
                />

                <!-- 消息控制 -->
                <div class="message-controls mt-3">
                  <n-space>
                    <n-button size="small" :disabled="messages.length === 0" @click="clearMessages">
                      {{ $t('dataSource.websocket.clearMessages') }}
                    </n-button>
                    <n-button size="small" type="primary" @click="pauseMessages">
                      {{
                        messagesPaused
                          ? $t('dataSource.websocket.resumeMessages')
                          : $t('dataSource.websocket.pauseMessages')
                      }}
                    </n-button>
                  </n-space>
                </div>
              </n-card>
            </n-space>
          </div>
        </n-tab-pane>

        <!-- 高级配置 -->
        <n-tab-pane name="advanced" :tab="$t('dataSource.websocket.advanced')">
          <div class="tab-content">
            <n-space vertical :size="16">
              <!-- 连接超时 -->
              <n-form-item :label="$t('dataSource.websocket.connectionTimeout')">
                <n-input-number
                  v-model:value="wsConfig.connectionTimeout"
                  :min="1000"
                  :max="60000"
                  :step="1000"
                  :placeholder="$t('dataSource.websocket.connectionTimeoutPlaceholder')"
                  class="w-full"
                >
                  <template #suffix>ms</template>
                </n-input-number>
              </n-form-item>

              <!-- 消息缓冲区大小 -->
              <n-form-item :label="$t('dataSource.websocket.bufferSize')">
                <n-input-number
                  v-model:value="wsConfig.bufferSize"
                  :min="10"
                  :max="10000"
                  :step="10"
                  :placeholder="$t('dataSource.websocket.bufferSizePlaceholder')"
                  class="w-full"
                >
                  <template #suffix>{{ $t('dataSource.websocket.messages') }}</template>
                </n-input-number>
              </n-form-item>

              <!-- 二进制类型 -->
              <n-form-item :label="$t('dataSource.websocket.binaryType')">
                <n-select
                  v-model:value="wsConfig.binaryType"
                  :options="binaryTypeOptions"
                  :placeholder="$t('dataSource.websocket.selectBinaryType')"
                />
              </n-form-item>

              <!-- 压缩支持 -->
              <n-form-item :label="$t('dataSource.websocket.compression')">
                <n-switch v-model:value="wsConfig.compression" :checked-value="true" :unchecked-value="false" />
              </n-form-item>
            </n-space>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * WebSocket数据输入组件
 * 提供完整的WebSocket连接配置功能，包括URL配置、协议选择、心跳设置和重连策略
 */

import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { LinkOutline, UnlinkOutline } from '@vicons/ionicons5'
import type { FormInst, FormRules, TagType } from 'naive-ui'
import type { WebSocketConfigData, KeyValuePair, TestConnectionResponse, ValidationResult } from '../types'
import JsonDataInput from './JsonDataInput.vue'
import KeyValueEditor from './KeyValueEditor.vue'

// 图标组件
const ConnectedIcon = LinkOutline
const DisconnectedIcon = UnlinkOutline

// 组件接口定义
interface Props {
  /** WebSocket配置数据 */
  modelValue: WebSocketConfigData
  /** 是否只读模式 */
  readonly?: boolean
}

interface Emits {
  /** 配置数据更新 */
  'update:modelValue': [value: WebSocketConfigData]
  /** 连接测试结果 */
  'test-result': [result: TestConnectionResponse]
  /** 验证状态变化 */
  'validation-change': [result: ValidationResult]
  /** 配置变化 */
  change: [config: WebSocketConfigData]
  /** 消息接收 */
  message: [message: any]
}

// Props和Emits
const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// 基础设置
const { t } = useI18n()
const themeStore = useThemeStore()

// 表单引用和验证
const formRef = ref<FormInst>()

// 本地状态管理
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
  compression: false
})

// UI状态
const activeTab = ref('connection')
const testLoading = ref(false)

// WebSocket连接状态
const connectionStatus = reactive<{
  connected?: boolean
  lastConnectTime?: string
  connectTime?: number
}>({})

// 消息相关状态
const messages = ref<
  Array<{
    type: 'message' | 'open' | 'close' | 'error' | 'heartbeat'
    content: string
    timestamp: string
    raw?: any
  }>
>([])

const messagesPaused = ref(false)

// URL验证状态
const urlValidation = reactive<{
  type: TagType
  message: string
}>({
  type: 'default',
  message: ''
})

// WebSocket实例引用
let websocketInstance: WebSocket | null = null
let heartbeatTimer: number | null = null

// 二进制类型选项
const binaryTypeOptions = computed(() => [
  { label: 'ArrayBuffer', value: 'arraybuffer' },
  { label: 'Blob', value: 'blob' }
])

// URL有效性检查
const isUrlValid = computed(() => {
  if (!wsConfig.url) return false
  try {
    const url = new URL(wsConfig.url)
    return url.protocol === 'ws:' || url.protocol === 'wss:'
  } catch {
    return false
  }
})

// 是否有消息
const hasMessages = computed(() => messages.value.length > 0)

// 最近消息（限制显示数量）
const recentMessages = computed(() => {
  return messages.value.slice(0, 50)
})

// 连接持续时间
const connectionDuration = computed(() => {
  if (!connectionStatus.connected || !connectionStatus.connectTime) return '-'

  const duration = Date.now() - connectionStatus.connectTime
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
})

// 表单验证规则
const formRules: FormRules = {
  url: [
    { required: true, message: t('dataSource.websocket.urlRequired'), trigger: 'blur' },
    {
      validator: (rule, value) => {
        if (!value) return true
        try {
          const url = new URL(value)
          if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
            return new Error(t('dataSource.websocket.urlProtocolInvalid'))
          }
          return true
        } catch {
          return new Error(t('dataSource.websocket.urlInvalid'))
        }
      },
      trigger: 'blur'
    }
  ]
}

/**
 * 验证URL格式
 */
const validateUrl = async () => {
  if (!wsConfig.url) {
    urlValidation.type = 'default'
    urlValidation.message = ''
    return
  }

  try {
    const url = new URL(wsConfig.url)
    if (url.protocol === 'ws:' || url.protocol === 'wss:') {
      urlValidation.type = 'success'
      urlValidation.message = t('dataSource.websocket.urlValid', { protocol: url.protocol })
    } else {
      urlValidation.type = 'error'
      urlValidation.message = t('dataSource.websocket.urlProtocolInvalid')
    }
  } catch (error) {
    urlValidation.type = 'error'
    urlValidation.message = t('dataSource.websocket.urlInvalid')
  }

  // 触发验证状态变化事件
  const validation: ValidationResult = {
    type: urlValidation.type,
    text: urlValidation.type === 'success' ? t('common.valid') : t('common.invalid'),
    detail: urlValidation.message
  }
  emit('validation-change', validation)
}

/**
 * 测试WebSocket连接
 */
const testConnection = async () => {
  if (!isUrlValid.value) {
    window.$message?.warning(t('dataSource.websocket.urlInvalidForTest'))
    return
  }

  // 关闭现有连接
  disconnect()

  testLoading.value = true
  const startTime = Date.now()

  try {
    // 创建WebSocket连接
    websocketInstance = new WebSocket(wsConfig.url, getEnabledProtocols())

    // 设置二进制类型
    websocketInstance.binaryType = wsConfig.binaryType

    // 连接成功处理
    websocketInstance.onopen = event => {
      const responseTime = Date.now() - startTime
      connectionStatus.connected = true
      connectionStatus.lastConnectTime = new Date().toLocaleString()
      connectionStatus.connectTime = Date.now()

      addMessage('open', t('dataSource.websocket.connectionOpened'), event)

      // 开始心跳
      if (wsConfig.heartbeat.enabled) {
        startHeartbeat()
      }

      // 切换到消息预览标签页
      activeTab.value = 'messages'

      // 发送测试结果事件
      const testResult: TestConnectionResponse = {
        success: true,
        status: 101, // WebSocket升级状态码
        statusText: 'Switching Protocols',
        headers: {},
        data: { connected: true },
        responseTime,
        error: undefined
      }
      emit('test-result', testResult)

      window.$message?.success(t('dataSource.websocket.testSuccess', { time: responseTime }))
      testLoading.value = false
    }

    // 消息接收处理
    websocketInstance.onmessage = event => {
      let content = event.data
      let messageType = 'message'

      try {
        // 尝试解析JSON
        const parsed = JSON.parse(content)
        content = JSON.stringify(parsed, null, 2)
      } catch {
        // 非JSON数据，保持原样
      }

      addMessage(messageType as any, content, event.data)
      emit('message', event.data)
    }

    // 连接关闭处理
    websocketInstance.onclose = event => {
      connectionStatus.connected = false
      stopHeartbeat()

      const message = event.wasClean
        ? t('dataSource.websocket.connectionClosed', { code: event.code, reason: event.reason })
        : t('dataSource.websocket.connectionLost')

      addMessage('close', message, { code: event.code, reason: event.reason, wasClean: event.wasClean })

      // 如果启用自动重连
      if (wsConfig.reconnect.enabled && !event.wasClean) {
        scheduleReconnect()
      }

      testLoading.value = false
    }

    // 错误处理
    websocketInstance.onerror = event => {
      const responseTime = Date.now() - startTime
      connectionStatus.connected = false

      addMessage('error', t('dataSource.websocket.connectionError'), event)

      const testResult: TestConnectionResponse = {
        success: false,
        status: 0,
        statusText: 'Connection Error',
        headers: {},
        data: null,
        responseTime,
        error: t('dataSource.websocket.testFailed')
      }
      emit('test-result', testResult)

      window.$message?.error(t('dataSource.websocket.testError'))
      testLoading.value = false
    }

    // 连接超时处理
    setTimeout(() => {
      if (testLoading.value && websocketInstance?.readyState === WebSocket.CONNECTING) {
        websocketInstance.close()
        window.$message?.error(t('dataSource.websocket.connectionTimeout'))
        testLoading.value = false
      }
    }, wsConfig.connectionTimeout)
  } catch (error: any) {
    const responseTime = Date.now() - startTime

    const testResult: TestConnectionResponse = {
      success: false,
      status: 0,
      statusText: 'Error',
      headers: {},
      data: null,
      responseTime,
      error: error.message
    }
    emit('test-result', testResult)

    window.$message?.error(t('dataSource.websocket.testError', { error: error.message }))
    testLoading.value = false
  }
}

/**
 * 断开WebSocket连接
 */
const disconnect = () => {
  if (websocketInstance) {
    stopHeartbeat()
    websocketInstance.close(1000, '用户主动断开')
    websocketInstance = null
  }
}

/**
 * 获取启用的协议列表
 */
const getEnabledProtocols = (): string[] => {
  return wsConfig.protocols.filter(protocol => protocol.enabled && protocol.key).map(protocol => protocol.key)
}

/**
 * 开始心跳
 */
const startHeartbeat = () => {
  if (!wsConfig.heartbeat.enabled || !websocketInstance) return

  stopHeartbeat()

  heartbeatTimer = window.setInterval(() => {
    if (websocketInstance?.readyState === WebSocket.OPEN) {
      const message = getHeartbeatMessage()
      websocketInstance.send(message)
      addMessage('heartbeat', `发送心跳: ${message}`)
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
const getHeartbeatMessage = (): string => {
  switch (wsConfig.heartbeat.messageType) {
    case 'ping':
      return 'ping'
    case 'json':
      return wsConfig.heartbeat.jsonMessage || '{"type":"ping"}'
    case 'text':
      return 'heartbeat'
    case 'custom':
      return wsConfig.heartbeat.customMessage || 'ping'
    default:
      return 'ping'
  }
}

/**
 * 添加消息到列表
 */
const addMessage = (type: 'message' | 'open' | 'close' | 'error' | 'heartbeat', content: string, raw?: any) => {
  if (messagesPaused.value) return

  messages.value.unshift({
    type,
    content,
    timestamp: new Date().toLocaleTimeString(),
    raw
  })

  // 限制消息数量
  if (messages.value.length > wsConfig.bufferSize) {
    messages.value = messages.value.slice(0, wsConfig.bufferSize)
  }
}

/**
 * 获取消息类型标签样式
 */
const getMessageType = (type: string): TagType => {
  switch (type) {
    case 'open':
      return 'success'
    case 'close':
      return 'warning'
    case 'error':
      return 'error'
    case 'heartbeat':
      return 'info'
    case 'message':
      return 'default'
    default:
      return 'default'
  }
}

/**
 * 清空消息
 */
const clearMessages = () => {
  messages.value = []
  addMessage('message', t('dataSource.websocket.messagesCleared'))
}

/**
 * 暂停/恢复消息
 */
const pauseMessages = () => {
  messagesPaused.value = !messagesPaused.value
  const action = messagesPaused.value ? '暂停' : '恢复'
  window.$message?.info(`${action}消息接收`)
}

/**
 * 安排重连
 */
const scheduleReconnect = () => {
  // 实现重连逻辑
  // 这里可以添加指数退避算法
}

/**
 * 同步配置到父组件
 */
const syncToParent = () => {
  emit('update:modelValue', { ...wsConfig })
  emit('change', { ...wsConfig })
}

/**
 * 处理协议变化
 */
const handleProtocolsChange = (protocols: KeyValuePair[]) => {
  wsConfig.protocols = protocols
  syncToParent()
}

/**
 * 处理请求头变化
 */
const handleHeadersChange = (headers: KeyValuePair[]) => {
  wsConfig.headers = headers
  syncToParent()
}

/**
 * 处理心跳开关变化
 */
const handleHeartbeatToggle = (enabled: boolean) => {
  if (enabled && websocketInstance?.readyState === WebSocket.OPEN) {
    startHeartbeat()
  } else {
    stopHeartbeat()
  }
  syncToParent()
}

/**
 * 处理心跳消息类型变化
 */
const handleHeartbeatMessageTypeChange = () => {
  // 重新开始心跳以应用新的消息类型
  if (wsConfig.heartbeat.enabled && websocketInstance?.readyState === WebSocket.OPEN) {
    startHeartbeat()
  }
  syncToParent()
}

/**
 * 组件验证
 */
const validate = async (): Promise<boolean> => {
  try {
    await formRef.value?.validate()
    return true
  } catch {
    return false
  }
}

/**
 * 重置组件
 */
const reset = () => {
  disconnect()

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
  Object.assign(connectionStatus, {
    connected: undefined,
    lastConnectTime: undefined,
    connectTime: undefined
  })

  messages.value = []
  urlValidation.type = 'default'
  urlValidation.message = ''
  activeTab.value = 'connection'

  syncToParent()
}

/**
 * 获取当前配置
 */
const getConfig = (): WebSocketConfigData => {
  return { ...wsConfig }
}

// 监听外部数据变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(wsConfig)) {
      Object.assign(wsConfig, newValue)
    }
  },
  { deep: true, immediate: true }
)

// 监听配置变化，同步到父组件
watch(
  wsConfig,
  () => {
    syncToParent()
  },
  { deep: true }
)

// 组件卸载时清理
onUnmounted(() => {
  disconnect()
})

// 导出方法供父组件调用
defineExpose({
  validate,
  reset,
  getConfig,
  testConnection,
  disconnect
})
</script>

<style scoped>
/**
 * WebSocket数据输入组件样式
 */

.websocket-data-input {
  width: 100%;
}

/* 标签页内容样式 */
.tab-content {
  padding: 16px 0;
  min-height: 200px;
}

/* URL验证状态样式 */
.url-validation {
  margin-top: 8px;
}

/* 连接状态样式 */
.connection-status {
  padding: 12px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

/* 消息统计样式 */
.message-stats {
  padding: 12px;
  background: var(--body-color);
  border-radius: var(--border-radius);
}

/* 消息列表样式 */
.message-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px;
}

.message-item {
  margin-bottom: 12px;
  padding: 8px;
  background: var(--card-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.message-item:last-child {
  margin-bottom: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-content {
  font-size: 12px;
}

.message-controls {
  padding-top: 12px;
  border-top: 1px solid var(--divider-color);
}

/* 工具类 */
.w-full {
  width: 100%;
}

.flex-1 {
  flex: 1;
}

.text-sm {
  font-size: 0.875rem;
}

.text-xs {
  font-size: 0.75rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mr-1 {
  margin-right: 0.25rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

/* 暗主题适配 */
[data-theme='dark'] .connection-status {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .message-stats {
  background: rgba(255, 255, 255, 0.03);
}

[data-theme='dark'] .message-list {
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .message-item {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tab-content {
    padding: 12px 0;
  }

  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .message-list {
    max-height: 300px;
  }
}
</style>
