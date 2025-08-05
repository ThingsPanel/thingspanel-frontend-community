<template>
  <div class="device-api-example">
    <n-card title="设备API请求示例" size="large">
      <template #header-extra>
        <n-space>
          <n-button size="small" @click="showInstructions = !showInstructions">
            {{ showInstructions ? '隐藏说明' : '显示说明' }}
          </n-button>
          <n-button size="small" @click="resetAll">重置所有</n-button>
        </n-space>
      </template>

      <!-- 使用说明 -->
      <template v-if="showInstructions">
        <n-alert type="info" class="instructions">
          <template #header>
            <strong>使用说明</strong>
          </template>
          <template #default>
            <div class="instruction-content">
              <p>
                <strong>1. 设备选择</strong>
                ：选择要操作的设备，支持搜索和过滤
              </p>
              <p>
                <strong>2. API类型</strong>
                ：选择要使用的API类型，不同类型有不同的参数
              </p>
              <p>
                <strong>3. 参数配置</strong>
                ：根据API类型填写相应的参数
              </p>
              <p>
                <strong>4. 轮询配置</strong>
                ：可选择启用轮询，自动定时获取数据
              </p>
              <p>
                <strong>5. 数据预览</strong>
                ：查看API返回的数据格式和内容
              </p>
            </div>
          </template>
        </n-alert>
      </template>

      <!-- 遥测数据表单示例 -->
      <n-divider title-placement="left">
        <n-space align="center">
          <n-icon><Analytics /></n-icon>
          <span>遥测数据API</span>
        </n-space>
      </n-divider>

      <TelemetryApiForm v-model="telemetryConfig" @update:modelValue="onTelemetryConfigChange" />

      <!-- 配置信息显示 -->
      <n-divider title-placement="left">
        <n-space align="center">
          <n-icon><Settings /></n-icon>
          <span>当前配置</span>
        </n-space>
      </n-divider>

      <n-card size="small" title="配置信息">
        <n-descriptions :column="2" bordered>
          <n-descriptions-item label="设备ID">
            {{ telemetryConfig.deviceId || '未选择' }}
          </n-descriptions-item>
          <n-descriptions-item label="API类型">
            {{ getApiTypeLabel(telemetryConfig.apiType) }}
          </n-descriptions-item>
          <n-descriptions-item label="轮询状态">
            <n-tag :type="telemetryConfig.polling?.enabled ? 'success' : 'default'">
              {{ telemetryConfig.polling?.enabled ? '已启用' : '未启用' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="轮询间隔">
            {{ telemetryConfig.polling?.interval ? `${telemetryConfig.polling.interval / 1000}秒` : '未设置' }}
          </n-descriptions-item>
        </n-descriptions>
      </n-card>

      <!-- 代码示例 -->
      <n-divider title-placement="left">
        <n-space align="center">
          <n-icon><Code /></n-icon>
          <span>代码示例</span>
        </n-space>
      </n-divider>

      <n-card size="small" title="配置代码">
        <template #header-extra>
          <n-button size="tiny" text @click="copyConfigCode">复制代码</n-button>
        </template>
        <div class="code-block">
          <pre>{{ configCode }}</pre>
        </div>
      </n-card>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NDivider, NSpace, NButton, NAlert, NDescriptions, NDescriptionsItem, NTag, NIcon } from 'naive-ui'
import { Analytics, Settings, Code } from '@vicons/ionicons5'
import TelemetryApiForm from './TelemetryApiForm.vue'
import { API_TYPE_OPTIONS } from '../index'

// 响应式数据
const showInstructions = ref(true)
const telemetryConfig = ref<Record<string, any>>({
  deviceId: '',
  apiType: 'telemetry_current',
  keys: '',
  key: '',
  time_range: '1h',
  aggregate_function: 'avg',
  value: '',
  polling: {
    enabled: false,
    interval: 5000,
    status: 'stopped'
  }
})

// 计算属性
const configCode = computed(() => {
  return `// 设备API配置示例
const deviceApiConfig = {
  // 设备配置
  deviceId: "${telemetryConfig.value.deviceId || 'your_device_id'}",
  
  // API类型
  apiType: "${telemetryConfig.value.apiType}",
  
  // 参数配置
  parameters: {
    ${telemetryConfig.value.keys ? `keys: "${telemetryConfig.value.keys}",` : ''}
    ${telemetryConfig.value.key ? `key: "${telemetryConfig.value.key}",` : ''}
    ${telemetryConfig.value.time_range ? `time_range: "${telemetryConfig.value.time_range}",` : ''}
    ${telemetryConfig.value.aggregate_function ? `aggregate_function: "${telemetryConfig.value.aggregate_function}",` : ''}
    ${telemetryConfig.value.value ? `value: "${telemetryConfig.value.value}",` : ''}
  },
  
  // 轮询配置
  polling: {
    enabled: ${telemetryConfig.value.polling?.enabled || false},
    interval: ${telemetryConfig.value.polling?.interval || 5000},
    status: "${telemetryConfig.value.polling?.status || 'stopped'}"
  }
}

// 使用示例
import { TelemetryApiForm } from '@/components/visual-editor/settings/data-sources/device-apis'

// 在Vue组件中使用
<TelemetryApiForm
  v-model="deviceApiConfig"
  @update:modelValue="handleConfigChange"
/>`
})

// 事件处理
const onTelemetryConfigChange = (config: Record<string, any>) => {
  telemetryConfig.value = { ...telemetryConfig.value, ...config }
  console.log('遥测配置变更:', config)
}

const resetAll = () => {
  telemetryConfig.value = {
    deviceId: '',
    apiType: 'telemetry_current',
    keys: '',
    key: '',
    time_range: '1h',
    aggregate_function: 'avg',
    value: '',
    polling: {
      enabled: false,
      interval: 5000,
      status: 'stopped'
    }
  }
}

const copyConfigCode = async () => {
  try {
    await navigator.clipboard.writeText(configCode.value)
    console.log('配置代码已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 工具函数
const getApiTypeLabel = (apiType: string) => {
  const option = API_TYPE_OPTIONS.find(opt => opt.value === apiType)
  return option?.label || apiType
}
</script>

<style scoped>
.device-api-example {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.instructions {
  margin-bottom: 20px;
}

.instruction-content p {
  margin: 4px 0;
  line-height: 1.5;
}

.code-block {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #333;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>
