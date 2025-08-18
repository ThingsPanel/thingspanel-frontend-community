<!--
  WebSocket数据输入组件
  提供WebSocket连接配置功能，包含URL、协议、连接测试等
  从原DataSourceConfigForm拆分而来，专注于WebSocket连接处理
-->
<template>
  <n-space vertical :size="6">
    <!-- 基本配置 -->
    <n-space vertical :size="3">
      <!-- WebSocket URL配置 -->
      <n-form-item label="WebSocket URL" size="small" :label-width="80">
        <n-input
          v-model:value="localConfig.url"
          placeholder="ws://localhost:8080/websocket 或 wss://api.example.com/ws"
          clearable
          size="small"
          @input="handleConfigChange"
        >
          <template #prefix>
            <n-icon size="12" style="color: var(--text-color-3)">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </n-icon>
          </template>
        </n-input>
      </n-form-item>

      <!-- 协议配置 -->
      <n-form-item size="small" :label-width="80">
        <template #label>
          <n-space :size="2" align="center">
            <span style="font-size: 11px">协议 (可选)</span>
            <n-tooltip placement="top" trigger="hover">
              <template #trigger>
                <n-icon size="10" style="color: var(--info-color); cursor: help">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </n-icon>
              </template>
              <div style="max-width: 220px; font-size: 10px">
                子协议列表，用逗号分隔<br>
                例如：chat, echo, json-rpc
              </div>
            </n-tooltip>
          </n-space>
        </template>
        <n-input
          v-model:value="localConfig.protocols"
          placeholder="例如：chat, echo"
          clearable
          size="small"
          @input="handleConfigChange"
        />
      </n-form-item>
    </n-space>

    <!-- 高级配置 -->
    <n-collapse>
      <n-collapse-item title="高级配置" name="advanced">
        <n-space vertical :size="4">
          <!-- 连接超时配置 -->
          <n-form-item label="连接超时" size="small" style="margin-bottom: 4px">
            <n-input-number
              v-model:value="localConfig.timeout"
              :min="1000"
              :max="30000"
              :step="1000"
              size="small"
              placeholder="10000"
              @update:value="handleConfigChange"
            >
              <template #suffix>ms</template>
            </n-input-number>
          </n-form-item>

          <!-- 重连配置 -->
          <n-form-item label="自动重连" size="small" style="margin-bottom: 4px">
            <n-switch 
              v-model:value="localConfig.autoReconnect" 
              size="small"
              @update:value="handleConfigChange"
            />
          </n-form-item>

          <!-- 重连间隔 -->
          <n-form-item 
            v-if="localConfig.autoReconnect"
            label="重连间隔" 
            size="small" 
            style="margin-bottom: 4px"
          >
            <n-input-number
              v-model:value="localConfig.reconnectInterval"
              :min="1000"
              :max="60000"
              :step="1000"
              size="small"
              placeholder="3000"
              @update:value="handleConfigChange"
            >
              <template #suffix>ms</template>
            </n-input-number>
          </n-form-item>

          <!-- 最大重连次数 -->
          <n-form-item 
            v-if="localConfig.autoReconnect"
            label="最大重连次数" 
            size="small" 
            style="margin-bottom: 0"
          >
            <n-input-number
              v-model:value="localConfig.maxReconnectAttempts"
              :min="0"
              :max="100"
              :step="1"
              size="small"
              placeholder="5"
              @update:value="handleConfigChange"
            >
              <template #suffix>次</template>
            </n-input-number>
          </n-form-item>
        </n-space>
      </n-collapse-item>
    </n-collapse>

    <!-- 连接测试区域 -->
    <n-card size="small" :bordered="false" style="background: var(--hover-color)">
      <template #header>
        <n-space justify="space-between" align="center">
          <n-text depth="2" style="font-size: 11px">连接测试</n-text>
          <n-space :size="4">
            <n-button 
              size="tiny" 
              type="primary" 
              :loading="connecting" 
              :disabled="!isConfigValid || isConnected"
              @click="testConnection"
            >
              🔌 连接测试
            </n-button>
            <n-button 
              v-if="isConnected"
              size="tiny" 
              type="error" 
              @click="disconnect"
            >
              ❌ 断开连接
            </n-button>
          </n-space>
        </n-space>
      </template>
      
      <n-space vertical :size="2">
        <!-- 连接状态 -->
        <n-space :size="4" align="center">
          <n-tag :type="connectionStatus.type" size="small" style="font-size: 10px">
            {{ connectionStatus.text }}
          </n-tag>
          <n-text depth="3" style="font-size: 10px" v-if="connectionStatus.message">
            {{ connectionStatus.message }}
          </n-text>
        </n-space>

        <!-- 消息发送测试 -->
        <div v-if="isConnected">
          <n-space :size="4" style="margin: 4px 0">
            <n-input
              v-model:value="testMessage"
              placeholder="发送测试消息"
              size="tiny"
              style="flex: 1"
              @keyup.enter="sendTestMessage"
            />
            <n-button size="tiny" type="info" @click="sendTestMessage" :disabled="!testMessage.trim()">
              📤 发送
            </n-button>
          </n-space>
        </div>
        
        <!-- 消息历史 -->
        <n-code
          :code="messageHistory"
          language="json"
          style="max-height: 150px; overflow-y: auto; font-size: 10px"
          :show-line-numbers="false"
        />
      </n-space>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
/**
 * WebSocket数据输入组件
 * 专门处理WebSocket连接的配置、测试等功能
 */

import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import {
  NSpace,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NCollapse,
  NCollapseItem,
  NTooltip,
  NIcon,
  NCard,
  NText,
  NButton,
  NTag,
  NCode
} from 'naive-ui'

// WebSocket配置接口
interface WebSocketConfig {
  url: string
  protocols: string
  timeout?: number
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

// Props 定义
interface Props {
  value: WebSocketConfig
}

// Emits 定义
interface Emits {
  (e: 'update:value', value: WebSocketConfig): void
  (e: 'change', value: WebSocketConfig): void
  (e: 'validation-changed', validation: { isValid: boolean; error: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 响应式数据 ==========

/** 本地配置绑定 */
const localConfig = computed({
  get: () => ({
    autoReconnect: false,
    timeout: 10000,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    ...props.value
  }),
  set: value => {
    emit('update:value', value)
    emit('change', value)
  }
})

/** 配置是否有效 */
const isConfigValid = computed(() => {
  const url = localConfig.value.url?.trim()
  return !!(url && (url.startsWith('ws://') || url.startsWith('wss://')))
})

/** WebSocket连接实例 */
const wsConnection = ref<WebSocket | null>(null)

/** 连接状态 */
const connecting = ref(false)
const isConnected = ref(false)

/** 连接状态显示 */
const connectionStatus = ref({
  type: 'default' as const,
  text: '未连接',
  message: ''
})

/** 测试消息 */
const testMessage = ref('')

/** 消息历史 */
const messageHistory = ref('{}')

/** 消息列表 */
const messages = ref<Array<{ type: string; message: any; timestamp: number }>>([])

// ========== 监听器 ==========

/** 监听配置变化进行验证 */
watch(
  localConfig,
  (newConfig) => {
    validateConfig(newConfig)
  },
  { immediate: true, deep: true }
)

// ========== 方法 ==========

/**
 * 验证WebSocket配置
 */
function validateConfig(config: WebSocketConfig): void {
  const errors: string[] = []

  // 验证URL
  if (!config.url || !config.url.trim()) {
    errors.push('WebSocket URL不能为空')
  } else {
    const url = config.url.trim()
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      errors.push('WebSocket URL必须以ws://或wss://开头')
    }
  }

  // 验证协议格式
  if (config.protocols && config.protocols.trim()) {
    const protocols = config.protocols.split(',').map(p => p.trim())
    const invalidProtocols = protocols.filter(p => !p || !/^[a-zA-Z0-9_.-]+$/.test(p))
    if (invalidProtocols.length > 0) {
      errors.push('协议名称包含无效字符')
    }
  }

  const isValid = errors.length === 0
  const error = errors.join('; ')

  emit('validation-changed', { isValid, error })
}

/**
 * 测试WebSocket连接
 */
async function testConnection(): Promise<void> {
  if (!isConfigValid.value) {
    window.$message?.warning('请先完善配置')
    return
  }

  if (wsConnection.value) {
    disconnect()
  }

  connecting.value = true
  connectionStatus.value = {
    type: 'info',
    text: '连接中...',
    message: '正在建立WebSocket连接'
  }

  try {
    const config = localConfig.value
    const url = config.url.trim()
    const protocols = config.protocols?.trim() 
      ? config.protocols.split(',').map(p => p.trim()).filter(Boolean)
      : undefined

    console.log(`🔌 [WebSocketDataInput] 开始测试WebSocket连接: ${url}`)
    
    // 创建WebSocket连接
    const ws = protocols && protocols.length > 0 
      ? new WebSocket(url, protocols)
      : new WebSocket(url)

    // 设置连接超时
    const timeout = config.timeout || 10000
    const timeoutId = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close()
        connectionStatus.value = {
          type: 'error',
          text: '连接超时',
          message: `连接超时 (${timeout}ms)`
        }
        connecting.value = false
      }
    }, timeout)

    // 监听连接打开
    ws.onopen = (event) => {
      clearTimeout(timeoutId)
      wsConnection.value = ws
      isConnected.value = true
      connecting.value = false
      
      connectionStatus.value = {
        type: 'success',
        text: '已连接',
        message: `WebSocket连接已建立 (${ws.protocol || '默认协议'})`
      }

      addMessage('system', '连接已建立', event)
      console.log('✅ [WebSocketDataInput] WebSocket连接成功')
      window.$message?.success('WebSocket连接成功')
    }

    // 监听消息接收
    ws.onmessage = (event) => {
      try {
        let messageData = event.data
        // 尝试解析JSON
        try {
          messageData = JSON.parse(event.data)
        } catch {
          // 不是JSON，保持原始数据
        }
        
        addMessage('received', messageData, event)
        console.log('📨 [WebSocketDataInput] 收到消息:', messageData)
      } catch (error) {
        console.error('❌ [WebSocketDataInput] 消息处理失败:', error)
      }
    }

    // 监听连接关闭
    ws.onclose = (event) => {
      clearTimeout(timeoutId)
      isConnected.value = false
      connecting.value = false
      wsConnection.value = null

      const reason = event.reason || '未知原因'
      connectionStatus.value = {
        type: 'warning',
        text: '连接关闭',
        message: `连接已关闭 (代码: ${event.code}, 原因: ${reason})`
      }

      addMessage('system', `连接关闭 (${event.code}: ${reason})`, event)
      console.log(`🔌 [WebSocketDataInput] WebSocket连接关闭: ${event.code} - ${reason}`)
    }

    // 监听连接错误
    ws.onerror = (event) => {
      clearTimeout(timeoutId)
      isConnected.value = false
      connecting.value = false
      wsConnection.value = null

      connectionStatus.value = {
        type: 'error',
        text: '连接错误',
        message: 'WebSocket连接发生错误'
      }

      addMessage('system', '连接错误', event)
      console.error('❌ [WebSocketDataInput] WebSocket连接错误:', event)
      window.$message?.error('WebSocket连接失败')
    }

  } catch (error) {
    connecting.value = false
    connectionStatus.value = {
      type: 'error',
      text: '连接失败',
      message: error instanceof Error ? error.message : '未知错误'
    }

    console.error('❌ [WebSocketDataInput] WebSocket连接异常:', error)
    window.$message?.error('连接失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

/**
 * 断开WebSocket连接
 */
function disconnect(): void {
  if (wsConnection.value) {
    wsConnection.value.close(1000, '手动断开连接')
    wsConnection.value = null
  }
  
  isConnected.value = false
  connecting.value = false
  
  connectionStatus.value = {
    type: 'default',
    text: '已断开',
    message: '手动断开连接'
  }

  console.log('🔌 [WebSocketDataInput] 手动断开WebSocket连接')
}

/**
 * 发送测试消息
 */
function sendTestMessage(): void {
  if (!wsConnection.value || !isConnected.value) {
    window.$message?.warning('请先建立连接')
    return
  }

  if (!testMessage.value.trim()) {
    window.$message?.warning('请输入测试消息')
    return
  }

  try {
    let messageToSend = testMessage.value.trim()
    
    // 尝试作为JSON发送
    try {
      const jsonData = JSON.parse(messageToSend)
      messageToSend = JSON.stringify(jsonData)
    } catch {
      // 不是JSON，作为普通文本发送
    }

    wsConnection.value.send(messageToSend)
    addMessage('sent', messageToSend)
    
    console.log('📤 [WebSocketDataInput] 发送消息:', messageToSend)
    testMessage.value = ''
    window.$message?.success('消息已发送')
  } catch (error) {
    console.error('❌ [WebSocketDataInput] 发送消息失败:', error)
    window.$message?.error('发送失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

/**
 * 添加消息到历史
 */
function addMessage(type: string, message: any, event?: any): void {
  const messageItem = {
    type,
    message,
    timestamp: Date.now()
  }

  messages.value.unshift(messageItem)
  
  // 保留最近20条消息
  if (messages.value.length > 20) {
    messages.value = messages.value.slice(0, 20)
  }

  // 更新消息历史显示
  updateMessageHistory()
}

/**
 * 更新消息历史显示
 */
function updateMessageHistory(): void {
  if (messages.value.length === 0) {
    messageHistory.value = '{}'
    return
  }

  const recentMessages = messages.value.slice(0, 10).map(msg => ({
    time: new Date(msg.timestamp).toLocaleTimeString(),
    type: msg.type,
    data: msg.message
  }))

  messageHistory.value = JSON.stringify({
    total: messages.value.length,
    recent: recentMessages
  }, null, 2)
}

// ========== 事件处理器 ==========

/**
 * 处理配置变化
 */
function handleConfigChange(): void {
  // 配置变化已通过computed处理，会触发watch进行验证
}

// ========== 生命周期 ==========

/** 组件卸载时清理连接 */
onUnmounted(() => {
  if (wsConnection.value) {
    wsConnection.value.close()
  }
})

// ========== 初始化 ==========

// 组件挂载时验证配置
nextTick(() => {
  validateConfig(localConfig.value)
  updateMessageHistory()
})
</script>

<style scoped>
/* WebSocket输入组件样式 */
.websocket-input-container {
  width: 100%;
}

/* 表单项样式优化 */
.websocket-form :deep(.n-form-item) {
  margin-bottom: 6px;
}

.websocket-form :deep(.n-form-item-label) {
  font-size: 11px;
  color: var(--text-color-2);
}

/* 折叠面板样式 */
.advanced-config :deep(.n-collapse-item__header) {
  font-size: 11px;
  padding: 6px 0;
}

.advanced-config :deep(.n-collapse-item__content-wrapper) {
  padding-top: 6px;
}

/* 连接测试区域样式 */
.connection-test {
  background: var(--hover-color);
  border-radius: 6px;
  padding: 8px;
}

/* 输入框样式 */
.config-input :deep(.n-input) {
  font-size: 11px;
}

.config-input :deep(.n-input__input) {
  font-size: 11px;
}

/* 数字输入框样式 */
.number-input :deep(.n-input-number) {
  font-size: 11px;
}

/* 开关样式 */
.switch-input :deep(.n-switch) {
  transform: scale(0.8);
}

/* 消息发送区域 */
.message-send {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* 工具提示样式 */
.tooltip-content {
  max-width: 250px;
  font-size: 10px;
  line-height: 1.3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .websocket-form :deep(.n-form-item) {
    margin-bottom: 8px;
  }
  
  .websocket-form :deep(.n-form-item-label) {
    font-size: 12px;
  }
  
  .config-input :deep(.n-input) {
    font-size: 12px;
  }
}

/* 明暗主题适配 */
[data-theme="dark"] .connection-test {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="light"] .connection-test {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.08);
}
</style>