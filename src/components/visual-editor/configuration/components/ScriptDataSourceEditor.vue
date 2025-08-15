<template>
  <div class="script-data-source-editor">
    <n-space vertical size="medium">
      <!-- 脚本编辑器 -->
      <n-form-item label="JavaScript 脚本" size="small">
        <template #label>
          <n-space align="center" size="small">
            <span>JavaScript 脚本</span>
            <n-tooltip>
              <template #trigger>
                <n-icon size="14" style="cursor: help">
                  <InformationCircleOutline />
                </n-icon>
              </template>
              <div style="max-width: 300px; font-size: 12px">
                <div><strong>脚本说明:</strong></div>
                <div>• 使用 return 语句返回数据</div>
                <div>• 可使用 _utils 内置工具函数</div>
                <div>• 支持 async/await 异步操作</div>
                <div>• 自动提供安全沙箱环境</div>
              </div>
            </n-tooltip>
          </n-space>
        </template>
        <n-input
          v-model:value="scriptCode"
          type="textarea"
          :rows="12"
          placeholder="请输入JavaScript脚本代码..."
          @update:value="onScriptChange"
        />
      </n-form-item>

      <!-- 快速模板 -->
      <n-form-item label="快速模板" size="small">
        <n-space>
          <n-button size="small" @click="loadTemplate('basic')">基础数据</n-button>
          <n-button size="small" @click="loadTemplate('random')">随机数据</n-button>
          <n-button size="small" @click="loadTemplate('time-series')">时间序列</n-button>
          <n-button size="small" @click="loadTemplate('api-mock')">API模拟</n-button>
        </n-space>
      </n-form-item>

      <!-- 执行配置 -->
      <n-form-item label="执行配置" size="small">
        <n-space align="center">
          <n-form-item label="超时时间" size="small" style="margin: 0">
            <n-input-number
              v-model:value="timeout"
              :min="1000"
              :max="30000"
              :step="1000"
              placeholder="毫秒"
              style="width: 100px"
              @update:value="onConfigChange"
            />
          </n-form-item>
          <n-form-item label="刷新间隔" size="small" style="margin: 0">
            <n-input-number
              v-model:value="refreshInterval"
              :min="0"
              :max="300000"
              :step="5000"
              placeholder="毫秒(0=不自动刷新)"
              style="width: 150px"
              @update:value="onConfigChange"
            />
          </n-form-item>
        </n-space>
      </n-form-item>

      <!-- 脚本验证 -->
      <n-card v-if="validationResult" size="small" embedded>
        <template #header>
          <n-space align="center">
            <span>脚本验证</span>
            <n-tag :type="validationResult.valid ? 'success' : 'error'" size="small">
              {{ validationResult.valid ? '通过' : '失败' }}
            </n-tag>
          </n-space>
        </template>

        <div v-if="!validationResult.valid && validationResult.error">
          <n-alert type="error" size="small">
            {{ validationResult.error }}
          </n-alert>
        </div>

        <div v-if="validationResult.valid">
          <n-text type="success" size="small">✅ 脚本语法正确，可以安全执行</n-text>
        </div>
      </n-card>

      <!-- 测试执行 -->
      <n-space>
        <n-button :disabled="!scriptCode.trim()" @click="validateScript">
          <template #icon>
            <n-icon><CheckmarkCircleOutline /></n-icon>
          </template>
          验证脚本
        </n-button>
        <n-button type="primary" :loading="testing" :disabled="!scriptCode.trim()" @click="testScript">
          <template #icon>
            <n-icon><PlayOutline /></n-icon>
          </template>
          测试执行
        </n-button>
        <n-button @click="clearScript">清空</n-button>
      </n-space>

      <!-- 测试结果 -->
      <n-card v-if="testResult" size="small" title="测试结果" embedded>
        <template #header-extra>
          <n-tag :type="testResult.success ? 'success' : 'error'" size="small">
            {{ testResult.success ? '成功' : '失败' }}
          </n-tag>
        </template>

        <n-space vertical size="small">
          <n-descriptions :column="2" size="small">
            <n-descriptions-item label="执行时间">{{ testResult.executionTime }}ms</n-descriptions-item>
            <n-descriptions-item label="日志数量">
              {{ testResult.logs.length }}
            </n-descriptions-item>
          </n-descriptions>

          <div v-if="testResult.success && testResult.data !== undefined">
            <n-text strong>执行结果:</n-text>
            <n-code
              :code="formatResult(testResult.data)"
              language="json"
              show-line-numbers
              style="margin-top: 8px; max-height: 200px; overflow-y: auto"
            />
          </div>

          <div v-if="!testResult.success && testResult.error">
            <n-text strong type="error">错误信息:</n-text>
            <n-alert type="error" style="margin-top: 8px">
              {{ testResult.error.message }}
            </n-alert>
          </div>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * 脚本数据源编辑器组件
 * 专门用于Visual Editor的脚本数据源配置
 */

import { ref, watch, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { InformationCircleOutline, CheckmarkCircleOutline, PlayOutline } from '@vicons/ionicons5'
import { defaultScriptEngine } from '@/core/script-engine'
import type { ScriptExecutionResult } from '@/core/script-engine/types'

interface Props {
  modelValue: {
    script: string
    timeout: number
    refreshInterval: number
    context?: Record<string, any>
  }
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const message = useMessage()

// 表单数据
const scriptCode = ref('')
const timeout = ref(5000)
const refreshInterval = ref(0)

// 状态
const testing = ref(false)
const validationResult = ref<{ valid: boolean; error?: string } | null>(null)
const testResult = ref<ScriptExecutionResult | null>(null)

/**
 * 脚本模板
 */
const templates = {
  basic: `// 基础数据生成示例
const data = {
  timestamp: new Date().toISOString(),
  value: _utils.mockData.randomNumber(0, 100),
  status: _utils.mockData.randomBoolean() ? 'active' : 'inactive',
  message: '数据更新成功'
};

console.log('生成基础数据:', data);
return data;`,

  random: `// 随机数据集生成
const count = 10;
const items = [];

for (let i = 0; i < count; i++) {
  items.push({
    id: i + 1,
    name: \`项目\${i + 1}\`,
    value: _utils.mockData.randomNumber(10, 100),
    category: ['A', 'B', 'C'][i % 3],
    enabled: _utils.mockData.randomBoolean(),
    createdAt: _utils.mockData.randomDate()
  });
}

console.log('生成', count, '条随机数据');
return {
  total: count,
  items: items,
  summary: {
    avgValue: items.reduce((sum, item) => sum + item.value, 0) / count,
    activeCount: items.filter(item => item.enabled).length
  }
};`,

  'time-series': `// 时间序列数据生成
const now = Date.now();
const interval = 5 * 60 * 1000; // 5分钟间隔
const count = 12; // 最近1小时数据

const series = [];
for (let i = count - 1; i >= 0; i--) {
  const timestamp = now - (i * interval);
  const baseValue = 50;
  const variance = 20;
  
  series.push({
    timestamp: new Date(timestamp).toISOString(),
    value: baseValue + _utils.mockData.randomNumber(-variance, variance),
    formatted: _utils.timeUtils.format(new Date(timestamp))
  });
}

console.log('生成时间序列数据:', series.length, '个数据点');
return {
  type: 'time-series',
  interval: '5min',
  data: series,
  latest: series[series.length - 1]
};`,

  'api-mock': `// API数据模拟
// 模拟设备状态数据
const devices = [
  { id: 'temp-001', name: '温度传感器1', type: 'sensor' },
  { id: 'hum-001', name: '湿度传感器1', type: 'sensor' },
  { id: 'gate-001', name: '智能网关1', type: 'gateway' }
];

const deviceData = devices.map(device => ({
  ...device,
  online: _utils.mockData.randomBoolean(),
  lastSeen: _utils.mockData.randomDate(),
  metrics: {
    temperature: device.type === 'sensor' ? _utils.mockData.randomNumber(15, 35) : null,
    humidity: device.type === 'sensor' ? _utils.mockData.randomNumber(30, 80) : null,
    uptime: _utils.mockData.randomNumber(0, 86400)
  }
}));

console.log('模拟API响应数据');
return {
  success: true,
  timestamp: new Date().toISOString(),
  data: deviceData,
  summary: {
    total: devices.length,
    online: deviceData.filter(d => d.online).length,
    offline: deviceData.filter(d => !d.online).length
  }
};`
}

/**
 * 加载模板
 */
const loadTemplate = (templateName: keyof typeof templates) => {
  scriptCode.value = templates[templateName]
  validationResult.value = null
  testResult.value = null
  onScriptChange()
  message.success(`已加载${templateName}模板`)
}

/**
 * 脚本内容变化
 */
const onScriptChange = () => {
  emitUpdate()
  // 清除之前的验证结果
  validationResult.value = null
  testResult.value = null
}

/**
 * 配置变化
 */
const onConfigChange = () => {
  emitUpdate()
}

/**
 * 发送更新事件
 */
const emitUpdate = () => {
  emit('update:modelValue', {
    script: scriptCode.value,
    timeout: timeout.value,
    refreshInterval: refreshInterval.value,
    context: {}
  })
}

/**
 * 验证脚本
 */
const validateScript = () => {
  if (!scriptCode.value.trim()) {
    message.error('请输入脚本代码')
    return
  }

  try {
    const result = defaultScriptEngine.validateScript(scriptCode.value)
    validationResult.value = result

    if (result.valid) {
      message.success('脚本语法验证通过')
    } else {
      message.error(`脚本语法错误: ${result.error}`)
    }
  } catch (error) {
    validationResult.value = { valid: false, error: (error as Error).message }
    message.error(`验证失败: ${(error as Error).message}`)
  }
}

/**
 * 测试脚本执行
 */
const testScript = async () => {
  if (!scriptCode.value.trim()) {
    message.error('请输入脚本代码')
    return
  }

  testing.value = true

  try {
    console.log('🧪 [ScriptDataSourceEditor] 测试执行脚本')

    const result = await defaultScriptEngine.execute(scriptCode.value)
    testResult.value = result

    if (result.success) {
      message.success(`脚本执行成功 (${result.executionTime}ms)`)
    } else {
      message.error(`脚本执行失败: ${result.error?.message}`)
    }
  } catch (error) {
    console.error('❌ [ScriptDataSourceEditor] 脚本测试失败:', error)
    message.error(`脚本测试失败: ${(error as Error).message}`)
  } finally {
    testing.value = false
  }
}

/**
 * 清空脚本
 */
const clearScript = () => {
  scriptCode.value = ''
  validationResult.value = null
  testResult.value = null
  onScriptChange()
  message.info('已清空脚本内容')
}

/**
 * 格式化结果
 */
const formatResult = (data: any): string => {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

/**
 * 初始化数据
 */
const initializeData = () => {
  if (props.modelValue) {
    scriptCode.value = props.modelValue.script || ''
    timeout.value = props.modelValue.timeout || 5000
    refreshInterval.value = props.modelValue.refreshInterval || 0
  }
}

// 监听props变化
watch(
  () => props.modelValue,
  () => {
    initializeData()
  },
  { immediate: true }
)

// 组件挂载时初始化
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.script-data-source-editor {
  padding: 4px;
}

:deep(.n-input__textarea-el) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
}

:deep(.n-form-item-label) {
  font-size: 13px;
}
</style>
