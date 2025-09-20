<template>
  <div class="property-binding-test-page">
    <n-card>
      <template #header>
        <h2>🔥 属性绑定修复验证页面</h2>
      </template>

      <n-space vertical :size="16">
        <!-- 测试组件 -->
        <n-card>
          <template #header>
            <h3>测试组件 - alert-status_1758344816591</h3>
          </template>

          <n-space vertical :size="12">
            <!-- 标题输入 - 已绑定属性 -->
            <n-form-item label="组件标题 (已绑定到HTTP参数)">
              <n-input
                v-model:value="componentTitle"
                placeholder="修改这个应该触发HTTP请求"
                @blur="onTitleChange"
              />
            </n-form-item>

            <!-- 设备ID输入 - 未绑定属性 -->
            <n-form-item label="设备ID (未绑定到HTTP参数)">
              <n-input
                v-model:value="deviceId"
                placeholder="修改这个不应该触发HTTP请求"
                @blur="onDeviceIdChange"
              />
            </n-form-item>

            <!-- 当前值显示 -->
            <n-descriptions title="当前属性值" :column="1">
              <n-descriptions-item label="组件标题">{{ componentTitle }}</n-descriptions-item>
              <n-descriptions-item label="设备ID">{{ deviceId }}</n-descriptions-item>
            </n-descriptions>
          </n-space>
        </n-card>

        <!-- HTTP配置显示 -->
        <n-card>
          <template #header>
            <h3>HTTP配置 - 绑定检查</h3>
          </template>

          <n-code
            language="json"
            :code="httpConfigDisplay"
            word-wrap
          />

          <n-alert type="info" style="margin-top: 12px;">
            <strong>绑定关系说明：</strong><br>
            • 组件标题绑定路径：alert-status_1758344816591.component.title<br>
            • 设备ID未绑定到任何HTTP参数<br>
            • 只有标题修改应该触发HTTP请求
          </n-alert>
        </n-card>

        <!-- 日志显示 -->
        <n-card>
          <template #header>
            <h3>实时日志监控</h3>
            <n-button @click="clearLogs" size="small" type="warning">清空日志</n-button>
          </template>

          <n-scrollbar style="max-height: 400px;">
            <n-log
              :log="logContent"
              :rows="20"
              language="text"
            />
          </n-scrollbar>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 🔥 属性绑定修复验证页面
 * 用于测试修复后的属性绑定系统是否正确工作
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { useCard2Props } from '@/card2.1/hooks/useCard2Props'

// 模拟组件ID
const COMPONENT_ID = 'alert-status_1758344816591'

// 响应式状态
const componentTitle = ref('测试标题')
const deviceId = ref('test-device-001')
const logContent = ref('')

// 模拟HTTP配置
const httpConfigDisplay = `{
  "dataSources": [{
    "sourceId": "dataSource1",
    "dataItems": [{
      "item": {
        "type": "http",
        "config": {
          "url": "http://localhost:3000/api/test",
          "method": "GET",
          "params": [
            {
              "key": "title",
              "value": "alert-status_1758344816591.component.title",
              "enabled": true,
              "valueMode": "component"
            },
            {
              "key": "static_param",
              "value": "static_value",
              "enabled": true,
              "valueMode": "static"
            }
          ]
        }
      }
    }]
  }]
}`

// 统一配置管理
const unifiedConfig = {
  base: {
    deviceId: deviceId.value
  },
  component: {
    title: componentTitle.value
  },
  dataSource: JSON.parse(httpConfigDisplay)
}

// 使用Card2Props系统
const {
  updateConfig,
  updateUnifiedConfig,
  exposeWhitelistedProperties
} = useCard2Props({
  config: unifiedConfig.component,
  componentId: COMPONENT_ID,
  initialUnifiedConfig: unifiedConfig
})

// 日志函数
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  logContent.value += `[${timestamp}] ${message}\n`
}

const clearLogs = () => {
  logContent.value = ''
}

// 事件处理
const onTitleChange = () => {
  addLog(`🔥 用户修改了标题: ${componentTitle.value}`)
  addLog(`   - 这个属性已绑定到HTTP参数，应该触发请求`)

  // 更新组件配置
  updateConfig('component', { title: componentTitle.value })

  addLog(`   - 已调用 updateConfig，等待绑定检查结果...`)
}

const onDeviceIdChange = () => {
  addLog(`🔥 用户修改了设备ID: ${deviceId.value}`)
  addLog(`   - 这个属性未绑定到HTTP参数，不应该触发请求`)

  // 更新基础配置
  updateUnifiedConfig({
    base: { deviceId: deviceId.value }
  })

  addLog(`   - 已调用 updateUnifiedConfig，等待绑定检查结果...`)
}

// 监听调试日志
let originalConsoleLog: typeof console.log
let originalConsoleError: typeof console.error

const setupLogInterception = () => {
  originalConsoleLog = console.log
  originalConsoleError = console.error

  console.log = (...args: any[]) => {
    originalConsoleLog(...args)

    // 拦截特定的调试日志
    const message = args.join(' ')
    if (
      message.includes('[InteractionManager]') ||
      message.includes('[useCard2Props]') ||
      message.includes('[VisualEditorBridge]') ||
      message.includes('绑定检查') ||
      message.includes('HTTP请求') ||
      message.includes('数据源')
    ) {
      addLog(`DEBUG: ${message}`)
    }
  }

  console.error = (...args: any[]) => {
    originalConsoleError(...args)

    const message = args.join(' ')
    if (
      message.includes('[InteractionManager]') ||
      message.includes('[useCard2Props]') ||
      message.includes('[VisualEditorBridge]')
    ) {
      addLog(`ERROR: ${message}`)
    }
  }
}

const restoreLogInterception = () => {
  if (originalConsoleLog) {
    console.log = originalConsoleLog
  }
  if (originalConsoleError) {
    console.error = originalConsoleError
  }
}

onMounted(() => {
  addLog('🚀 属性绑定测试页面已加载')
  addLog('📝 请按以下步骤测试：')
  addLog('1. 修改组件标题 - 应该触发HTTP请求')
  addLog('2. 修改设备ID - 不应该触发HTTP请求')
  addLog('3. 观察控制台日志确认修复效果')
  addLog('')

  setupLogInterception()

  // 暴露属性
  exposeWhitelistedProperties()
})

onUnmounted(() => {
  restoreLogInterception()
})
</script>

<style scoped>
.property-binding-test-page {
  padding: 24px;
  min-height: 100vh;
  background-color: var(--n-color);
}

.n-card {
  margin-bottom: 16px;
}

.n-log {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>